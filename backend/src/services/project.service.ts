import type { QueryFilter, Types } from "mongoose";
import { ProjectModel, type IProject } from "../models/Project";
import { TaskModel } from "../models/Task";
import { TeamModel } from "../models/Team";
import { canCreateProject, canManageProject } from "../policies/taskPolicy";
import type { AuthUser } from "../types";
import { AppError } from "../utils/AppError";
import { toObjectId } from "../utils/helpers";
import type { CreateProjectInput, UpdateProjectInput } from "../validators/project.validators";

interface Progress {
  total: number;
  done: number;
  /** 0-100, rounded. A project with no tasks is 0%. */
  percent: number;
}

/** Counts tasks per project in one query and turns them into progress numbers. */
async function getProgress(projectIds: Types.ObjectId[]): Promise<Map<string, Progress>> {
  const rows = await TaskModel.aggregate<{ _id: Types.ObjectId; total: number; done: number }>([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: "$project",
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
      },
    },
  ]);

  const result = new Map<string, Progress>();
  for (const row of rows) {
    result.set(row._id.toString(), {
      total: row.total,
      done: row.done,
      percent: Math.round((row.done / row.total) * 100),
    });
  }
  return result;
}

const EMPTY_PROGRESS: Progress = { total: 0, done: 0, percent: 0 };

function populateProject() {
  return [
    { path: "team", select: "name" },
    { path: "createdBy", select: "name" },
  ];
}
type ProjectRefs = { team: { _id: Types.ObjectId; name: string }; createdBy: { _id: Types.ObjectId; name: string } };

export async function listProjects(user: AuthUser) {
  const filter: QueryFilter<IProject> = {};
  if (user.role === "MANAGER") filter.team = user.teamId ? toObjectId(user.teamId) : null;

  const projects = await ProjectModel.find(filter)
    .populate<ProjectRefs>(populateProject())
    .sort({ createdAt: -1 })
    .lean();
  const progress = await getProgress(projects.map((p) => p._id));

  return projects.map((p) => ({ ...p, progress: progress.get(p._id.toString()) ?? EMPTY_PROGRESS }));
}

export async function getProject(user: AuthUser, id: string) {
  const project = await ProjectModel.findById(toObjectId(id, "project id"))
    .populate<ProjectRefs>(populateProject())
    .lean();
  if (!project) throw AppError.notFound("Project not found");
  if (!canManageProject(user, project.team._id.toString())) throw AppError.forbidden("This project belongs to another team");

  const progress = await getProgress([project._id]);
  return { ...project, progress: progress.get(project._id.toString()) ?? EMPTY_PROGRESS };
}

export async function createProject(user: AuthUser, input: CreateProjectInput) {
  if (!canCreateProject(user)) throw AppError.forbidden();

  // Managers always use their own team. Admins must choose one.
  let teamId: string;
  if (user.role === "MANAGER") {
    if (!user.teamId) throw AppError.badRequest("You are not assigned to a team yet");
    if (input.teamId && input.teamId !== user.teamId) throw AppError.forbidden("You can only create projects for your own team");
    teamId = user.teamId;
  } else {
    if (!input.teamId) throw AppError.badRequest("teamId is required");
    teamId = input.teamId;
  }
  if (!(await TeamModel.exists({ _id: teamId }))) throw AppError.badRequest("Team does not exist");

  const project = await ProjectModel.create({
    name: input.name,
    description: input.description,
    clientName: input.clientName,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    team: teamId,
    createdBy: user.id,
  });
  return getProject(user, project.id);
}

export async function updateProject(user: AuthUser, id: string, input: UpdateProjectInput) {
  const project = await ProjectModel.findById(toObjectId(id, "project id"));
  if (!project) throw AppError.notFound("Project not found");
  if (!canManageProject(user, project.team.toString())) throw AppError.forbidden("This project belongs to another team");

  if (input.name !== undefined) project.name = input.name;
  if (input.description !== undefined) project.description = input.description;
  if (input.clientName !== undefined) project.clientName = input.clientName;
  if (input.startDate !== undefined) project.startDate = input.startDate;
  if (input.endDate !== undefined) project.endDate = input.endDate;
  if (input.status !== undefined) project.status = input.status;

  if (project.endDate < project.startDate) throw AppError.badRequest("End date must be on or after the start date");

  await project.save();
  return getProject(user, id);
}
