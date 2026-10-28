import type { Types } from "mongoose";
import { TASK_STATUSES, type TaskStatus } from "../constants";
import { ProjectModel } from "../models/Project";
import { TaskModel } from "../models/Task";
import { UserModel } from "../models/User";
import type { AuthUser } from "../types";
import { endOfDay, startOfDay, toObjectId } from "../utils/helpers";
import { countTasks, findTasks, visibilityFilter } from "./task.service";

type StatusCounts = Record<TaskStatus, number>;

/** Counts tasks per status inside what the user can see: admin = all, manager = team, employee = own. */
async function countByStatus(user: AuthUser): Promise<StatusCounts> {
  const rows = await TaskModel.aggregate<{ _id: TaskStatus; count: number }>([
    { $match: visibilityFilter(user) },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts: StatusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  for (const row of rows) counts[row._id] = row.count;
  return counts;
}

const overdueFilter = () => ({ status: { $ne: "DONE" as const }, dueDate: { $lt: new Date() } });

export async function getDashboard(user: AuthUser) {
  const tasksByStatus = await countByStatus(user);
  const overdueCount = await countTasks(user, overdueFilter());

  switch (user.role) {
    case "ADMIN": {
      const [totalUsers, totalProjects] = await Promise.all([UserModel.countDocuments(), ProjectModel.countDocuments()]);
      return { role: user.role, totalUsers, totalProjects, tasksByStatus, overdueCount };
    }

    case "MANAGER": {
      const members = user.teamId
        ? await UserModel.find({ team: toObjectId(user.teamId), role: "EMPLOYEE", isActive: true }).select("name").lean()
        : [];

      // Task count per (employee, status) in one query, then folded into a row per employee.
      const rows = await TaskModel.aggregate<{ _id: { assignee: Types.ObjectId; status: TaskStatus }; count: number }>([
        { $match: visibilityFilter(user) },
        { $group: { _id: { assignee: "$assignee", status: "$status" }, count: { $sum: 1 } } },
      ]);
      const workload = members.map((member) => {
        const byStatus: StatusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
        for (const row of rows) {
          if (row._id.assignee.toString() === member._id.toString()) byStatus[row._id.status] = row.count;
        }
        const total = TASK_STATUSES.reduce((sum, s) => sum + byStatus[s], 0);
        return { user: member, total, open: total - byStatus.DONE, byStatus };
      });

      return {
        role: user.role,
        tasksByStatus,
        overdueCount,
        workload,
        awaitingReview: await findTasks(user, { status: "IN_REVIEW" }, 10),
        overdueTasks: await findTasks(user, overdueFilter(), 10),
      };
    }

    case "EMPLOYEE": {
      const today = { status: { $ne: "DONE" as const }, dueDate: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) } };
      return {
        role: user.role,
        tasksByStatus,
        overdueCount,
        dueTodayCount: await countTasks(user, today),
        dueToday: await findTasks(user, today, 10),
        overdueTasks: await findTasks(user, overdueFilter(), 10),
      };
    }
  }
}
