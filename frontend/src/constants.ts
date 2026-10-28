// Values and display settings shared by the whole UI.
// The rules (who can do what) are NOT decided here - the API tells us (see `allowedStatuses`, `canEdit`).
import type { PriorityValue, ProjectStatusValue, Role, TaskStatus } from "./api/types";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "EMPLOYEE"];
export const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
export const PRIORITIES: PriorityValue[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const PROJECT_STATUSES: ProjectStatusValue[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"];

export const ROLE_LABELS: Record<Role, string> = { ADMIN: "Admin", MANAGER: "Manager", EMPLOYEE: "Employee" };

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

// Full class names are written out so Tailwind can find them.
export const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  DONE: "bg-emerald-100 text-emerald-700",
};
export const STATUS_BAR_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
};

export const PRIORITY_LABELS: Record<PriorityValue, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };
export const PRIORITY_STYLES: Record<PriorityValue, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

/**
 * Same rule as the API: sending a task back out of "In Review" needs a reason.
 * (Only used to decide whether to ask for a reason. The API still enforces it.)
 */
export function requiresReason(from: TaskStatus, to: TaskStatus): boolean {
  return from === "IN_REVIEW" && to !== "DONE";
}
