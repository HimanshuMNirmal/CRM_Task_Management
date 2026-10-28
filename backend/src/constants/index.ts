// All "enum-like" values live here so backend code and validation share one source of truth.

export const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ACTIVITY_ACTIONS = [
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_ASSIGNED",
  "STATUS_CHANGED",
  "ATTACHMENT_ADDED",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const NOTIFICATION_TYPES = ["TASK_ASSIGNED", "STATUS_CHANGED", "DUE_SOON"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Human-friendly names used in activity messages and CSV export. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};
