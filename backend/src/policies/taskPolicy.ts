// ---------------------------------------------------------------------------
// ACCESS CONTROL RULES
//
// This file is the single place that answers "is this user allowed to do X?".
// Every function is PURE (no database, no Express), so the rules are easy to read
// and easy to unit-test. Services call these functions; middleware only checks roles.
//
//   Admin    -> everything
//   Manager  -> only things that belong to their own team
//   Employee -> only tasks assigned to them
// ---------------------------------------------------------------------------
import { TASK_STATUSES, type Role, type TaskStatus } from "../constants";
import type { AuthUser } from "../types";

/** The facts about a task that the rules need. */
export interface TaskFacts {
  teamId: string;
  assigneeId: string;
  status: TaskStatus;
}

/** Result of a status-change check. `statusCode` tells the API which HTTP error to send. */
export type StatusCheck = { ok: true } | { ok: false; statusCode: 400 | 403; message: string };

function isOwnTeam(user: AuthUser, teamId: string): boolean {
  return user.teamId !== null && user.teamId === teamId;
}

// ---- Projects -------------------------------------------------------------

export function canCreateProject(user: AuthUser): boolean {
  return user.role === "ADMIN" || user.role === "MANAGER";
}

/** Used for viewing/editing a project and for creating tasks inside it. */
export function canManageProject(user: AuthUser, projectTeamId: string): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "MANAGER") return isOwnTeam(user, projectTeamId);
  return false;
}

// ---- Tasks ----------------------------------------------------------------

export function canCreateTask(user: AuthUser, projectTeamId: string): boolean {
  return canManageProject(user, projectTeamId);
}

export function canViewTask(user: AuthUser, task: TaskFacts): boolean {
  switch (user.role) {
    case "ADMIN":
      return true;
    case "MANAGER":
      return isOwnTeam(user, task.teamId);
    case "EMPLOYEE":
      return user.id === task.assigneeId;
  }
}

/** Commenting follows the same scope as viewing (see the access control matrix). */
export function canCommentOnTask(user: AuthUser, task: TaskFacts): boolean {
  return canViewTask(user, task);
}

/** Editing details (title, due date, assignee...). Employees can never edit. */
export function canEditTask(user: AuthUser, task: TaskFacts): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "MANAGER") return isOwnTeam(user, task.teamId);
  return false;
}

/** Tasks may only be assigned to an active Employee who belongs to the task's team. */
export function isValidAssignee(
  assignee: { role: Role; isActive: boolean; teamId: string | null },
  taskTeamId: string,
): boolean {
  return assignee.role === "EMPLOYEE" && assignee.isActive && assignee.teamId === taskTeamId;
}

// ---- Status workflow ------------------------------------------------------
//
//   TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
//
// Employees: only the first two steps, only on their own tasks.
// Managers/Admins: any status. Moving a task OUT of review (back for rework) needs a reason.

const EMPLOYEE_NEXT_STEP: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "IN_REVIEW",
};

/** A reason is required when review is rejected, i.e. IN_REVIEW -> anything except DONE. */
export function requiresReason(from: TaskStatus, to: TaskStatus): boolean {
  return from === "IN_REVIEW" && to !== "DONE";
}

export function checkStatusChange(
  user: AuthUser,
  task: TaskFacts,
  to: TaskStatus,
  reason?: string,
): StatusCheck {
  if (task.status === to) {
    return { ok: false, statusCode: 400, message: "Task is already in that status" };
  }

  if (user.role === "EMPLOYEE") {
    if (user.id !== task.assigneeId) {
      return { ok: false, statusCode: 403, message: "You can only update tasks assigned to you" };
    }
    if (EMPLOYEE_NEXT_STEP[task.status] !== to) {
      return {
        ok: false,
        statusCode: 403,
        message: "Employees can only move a task forward one step, up to In Review",
      };
    }
    return { ok: true };
  }

  // Manager or Admin
  if (user.role === "MANAGER" && !isOwnTeam(user, task.teamId)) {
    return { ok: false, statusCode: 403, message: "This task belongs to another team" };
  }
  if (requiresReason(task.status, to) && !reason?.trim()) {
    return { ok: false, statusCode: 400, message: "A reason is required when moving a task back from In Review" };
  }
  return { ok: true };
}

/** Which statuses could this user move the task to right now? The UI uses this to show buttons. */
export function allowedStatuses(user: AuthUser, task: TaskFacts): TaskStatus[] {
  return TASK_STATUSES.filter((to) => checkStatusChange(user, task, to, "placeholder reason").ok);
}
