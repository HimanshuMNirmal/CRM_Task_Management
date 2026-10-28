import type { PopulateOptions, QueryFilter, Types } from "mongoose";
import { STATUS_LABELS } from "../constants";
import { ProjectModel } from "../models/Project";
import { TaskModel, type ITask } from "../models/Task";
import { UserModel } from "../models/User";
import {
  allowedStatuses,
  canCommentOnTask,
  canCreateTask,
  canEditTask,
  canViewTask,
  checkStatusChange,
  isValidAssignee,
  type TaskFacts,
} from "../policies/taskPolicy";
import type { AuthUser } from "../types";
import { AppError } from "../utils/AppError";
import { toCsv } from "../utils/csv";
import { escapeRegex, toObjectId } from "../utils/helpers";
import type {
  ChangeStatusInput,
  CreateTaskInput,
  TaskQuery,
  UpdateTaskInput,
} from "../validators/task.validators";
import { logActivity } from "./activity.service";
import { notifyUsers } from "./notification.service";

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

type UserRef = { _id: Types.ObjectId; name: string; email?: string };
type PopulatedFields = {
  assignee: UserRef;
  project: { _id: Types.ObjectId; name: string };
  createdBy: UserRef;
};
type PopulatedTask = Omit<ITask, keyof PopulatedFields> & PopulatedFields & { _id: Types.ObjectId };

// Which related documents to load (and which of their fields) when returning tasks.
const POPULATE: PopulateOptions[] = [
  { path: "assignee", select: "name email" },
  { path: "project", select: "name" },
  { path: "createdBy", select: "name" },
];

/** The facts the policy functions need, taken from a task document. */
function factsOf(task: { team: Types.ObjectId; assignee: Types.ObjectId; status: ITask["status"] }): TaskFacts {
  return { teamId: task.team.toString(), assigneeId: task.assignee.toString(), status: task.status };
}

/** Adds computed fields the UI needs: overdue flag and what the current user may do with this task. */
function withMeta(user: AuthUser, task: PopulatedTask) {
  const facts = factsOf({ ...task, assignee: task.assignee._id });
  return {
    ...task,
    isOverdue: task.status !== "DONE" && task.dueDate.getTime() < Date.now(),
    canEdit: canEditTask(user, facts),
    canComment: canCommentOnTask(user, facts),
    allowedStatuses: allowedStatuses(user, facts),
  };
}

// ---------------------------------------------------------------------------
// Visibility ("View tasks" row of the access matrix)
// ---------------------------------------------------------------------------

/** Mongo filter that limits any task query to what this user is allowed to see. */
export function visibilityFilter(user: AuthUser): QueryFilter<ITask> {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return { team: user.teamId ? toObjectId(user.teamId) : null }; // no team -> matches nothing
    case "EMPLOYEE":
      return { assignee: toObjectId(user.id) };
  }
}

/** Translates the query string (?status=...&search=...) into a Mongo filter. */
function buildQueryFilter(q: TaskQuery): QueryFilter<ITask> {
  const filter: QueryFilter<ITask> = {};

  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.assignee) filter.assignee = toObjectId(q.assignee, "assignee");
  if (q.project) filter.project = toObjectId(q.project, "project");

  if (q.search) {
    const pattern = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const due: { $gte?: Date; $lte?: Date; $lt?: Date } = {};
  if (q.dueFrom) due.$gte = q.dueFrom;
  if (q.dueTo) due.$lte = q.dueTo;
  if (q.overdue === "true") {
    due.$lt = new Date();
    filter.status = q.status && q.status !== "DONE" ? q.status : { $ne: "DONE" }; // done tasks are never overdue
  }
  if (Object.keys(due).length > 0) filter.dueDate = due;

  return filter;
}

/**
 * Runs a task query with the visibility rule ALWAYS applied.
 * The two filters are combined with $and so a user-supplied filter (e.g. ?assignee=someoneElse)
 * can never widen what the user is allowed to see.
 */
async function queryTasks(user: AuthUser, extra: QueryFilter<ITask>, skip: number, limit: number) {
  const filter: QueryFilter<ITask> = { $and: [visibilityFilter(user), extra] };
  const [tasks, total] = await Promise.all([
    TaskModel.find(filter).populate<PopulatedFields>(POPULATE).sort({ dueDate: 1 }).skip(skip).limit(limit).lean(),
    TaskModel.countDocuments(filter),
  ]);
  return { items: tasks.map((t) => withMeta(user, t)), total };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export async function listTasks(user: AuthUser, query: TaskQuery) {
  const { items, total } = await queryTasks(user, buildQueryFilter(query), (query.page - 1) * query.limit, query.limit);
  return { items, total, page: query.page, limit: query.limit, pages: Math.max(1, Math.ceil(total / query.limit)) };
}

/** Used by the dashboard: a short list of tasks matching a filter. */
export async function findTasks(user: AuthUser, extra: QueryFilter<ITask>, limit: number) {
  return (await queryTasks(user, extra, 0, limit)).items;
}

export async function countTasks(user: AuthUser, extra: QueryFilter<ITask>): Promise<number> {
  return TaskModel.countDocuments({ $and: [visibilityFilter(user), extra] });
}

/** Loads a task (as a Mongoose document) or throws 404. */
async function findTaskOrThrow(id: string) {
  const task = await TaskModel.findById(toObjectId(id, "task id"));
  if (!task) throw AppError.notFound("Task not found");
  return task;
}

/** Throws 404/403 unless the user may see this task. Used by comments and activity too. */
export async function assertCanViewTask(user: AuthUser, id: string): Promise<void> {
  const task = await findTaskOrThrow(id);
  if (!canViewTask(user, factsOf(task))) throw AppError.forbidden("You do not have access to this task");
}

/** Throws 404/403 unless the user may comment on this task. */
export async function assertCanCommentOnTask(user: AuthUser, id: string): Promise<void> {
  const task = await findTaskOrThrow(id);
  if (!canCommentOnTask(user, factsOf(task))) throw AppError.forbidden("You cannot comment on this task");
}

export async function getTask(user: AuthUser, id: string) {
  await assertCanViewTask(user, id);
  const task = await TaskModel.findById(id).populate<PopulatedFields>(POPULATE).lean();
  if (!task) throw AppError.notFound("Task not found");
  return withMeta(user, task);
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

/** Loads the person we want to assign to and checks they belong to the task's team. */
async function loadAssignee(assigneeId: string, teamId: string) {
  const assignee = await UserModel.findById(toObjectId(assigneeId, "assignee id"));
  const valid =
    assignee &&
    isValidAssignee({ role: assignee.role, isActive: assignee.isActive, teamId: assignee.team?.toString() ?? null }, teamId);
  if (!assignee || !valid) {
    throw AppError.badRequest("The assignee must be an active employee of the project's team");
  }
  return assignee;
}

export async function createTask(user: AuthUser, input: CreateTaskInput) {
  const project = await ProjectModel.findById(toObjectId(input.projectId, "project id"));
  if (!project) throw AppError.notFound("Project not found");
  if (!canCreateTask(user, project.team.toString())) {
    throw AppError.forbidden("You can only create tasks in your own team's projects");
  }

  const assignee = await loadAssignee(input.assigneeId, project.team.toString());

  const task = await TaskModel.create({
    title: input.title,
    description: input.description,
    project: project._id,
    team: project.team,
    assignee: assignee._id,
    priority: input.priority,
    dueDate: input.dueDate,
    createdBy: user.id,
  });

  await logActivity(task._id, user.id, "TASK_CREATED", `Created the task and assigned it to ${assignee.name}`);
  await notifyUsers([assignee._id], task._id, "TASK_ASSIGNED", `You were assigned a task: "${task.title}"`, user.id);

  return getTask(user, task.id);
}

export async function updateTask(user: AuthUser, id: string, input: UpdateTaskInput) {
  const task = await findTaskOrThrow(id);
  if (!canEditTask(user, factsOf(task))) throw AppError.forbidden("You cannot edit this task");

  const changed: string[] = [];

  if (input.title !== undefined && input.title !== task.title) {
    task.title = input.title;
    changed.push("title");
  }
  if (input.description !== undefined && input.description !== task.description) {
    task.description = input.description;
    changed.push("description");
  }
  if (input.priority !== undefined && input.priority !== task.priority) {
    task.priority = input.priority;
    changed.push("priority");
  }
  if (input.dueDate !== undefined && input.dueDate.getTime() !== task.dueDate.getTime()) {
    task.dueDate = input.dueDate;
    task.dueSoonNotified = false; // the due-soon reminder may need to fire again for the new date
    changed.push("due date");
  }

  // Reassignment is logged and notified separately from other edits.
  let newAssigneeName: string | null = null;
  if (input.assigneeId !== undefined && input.assigneeId !== task.assignee.toString()) {
    const newAssignee = await loadAssignee(input.assigneeId, task.team.toString());
    const previous = await UserModel.findById(task.assignee).select("name");
    task.assignee = newAssignee._id;
    newAssigneeName = `${previous?.name ?? "someone"} to ${newAssignee.name}`;
  }

  await task.save();

  if (changed.length > 0) {
    await logActivity(task._id, user.id, "TASK_UPDATED", `Updated ${changed.join(", ")}`);
  }
  if (newAssigneeName) {
    await logActivity(task._id, user.id, "TASK_ASSIGNED", `Reassigned the task from ${newAssigneeName}`);
    await notifyUsers([task.assignee], task._id, "TASK_ASSIGNED", `You were assigned a task: "${task.title}"`, user.id);
  }

  return getTask(user, id);
}

export async function changeStatus(user: AuthUser, id: string, input: ChangeStatusInput) {
  const task = await findTaskOrThrow(id);

  // All the workflow rules live in the policy. Here we just ask and obey.
  const check = checkStatusChange(user, factsOf(task), input.status, input.reason);
  if (!check.ok) throw new AppError(check.statusCode, check.message);

  const from = task.status;
  task.status = input.status;
  await task.save();

  const reasonText = input.reason ? ` (reason: ${input.reason})` : "";
  await logActivity(
    task._id,
    user.id,
    "STATUS_CHANGED",
    `Changed status from ${STATUS_LABELS[from]} to ${STATUS_LABELS[input.status]}${reasonText}`,
  );

  // Tell the assignee and the team's manager (unless they made the change themselves).
  const manager = await UserModel.findOne({ team: task.team, role: "MANAGER", isActive: true }).select("_id");
  const recipients = manager ? [task.assignee, manager._id] : [task.assignee];
  await notifyUsers(
    recipients,
    task._id,
    "STATUS_CHANGED",
    `"${task.title}" moved to ${STATUS_LABELS[input.status]}`,
    user.id,
  );

  return getTask(user, id);
}

export async function addAttachment(user: AuthUser, id: string, file: Express.Multer.File | undefined) {
  if (!file) throw AppError.badRequest('Attach a file using the form field named "file"');
  const task = await findTaskOrThrow(id);
  if (!canEditTask(user, factsOf(task))) throw AppError.forbidden("You cannot add attachments to this task");

  task.attachments.push({
    originalName: file.originalname,
    fileName: file.filename,
    url: `/uploads/${file.filename}`,
    size: file.size,
  });
  await task.save();
  await logActivity(task._id, user.id, "ATTACHMENT_ADDED", `Attached "${file.originalname}"`);

  return getTask(user, id);
}

// ---------------------------------------------------------------------------
// CSV export (bonus)
// ---------------------------------------------------------------------------

export async function exportTasksCsv(user: AuthUser, query: TaskQuery): Promise<string> {
  const { items } = await queryTasks(user, buildQueryFilter(query), 0, 5000);
  const rows = items.map((t) => [
    t.title,
    t.project.name,
    t.assignee.name,
    STATUS_LABELS[t.status],
    t.priority,
    t.dueDate.toISOString().slice(0, 10),
    t.isOverdue ? "Yes" : "No",
    t.createdBy.name,
  ]);
  return toCsv(["Title", "Project", "Assignee", "Status", "Priority", "Due date", "Overdue", "Created by"], rows);
}
