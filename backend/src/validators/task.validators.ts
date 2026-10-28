import { z } from "zod";
import { PRIORITIES, TASK_STATUSES } from "../constants";
import { objectId } from "./common";

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().default(""),
  projectId: objectId,
  assigneeId: objectId,
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueDate: z.coerce.date(),
});

// Project cannot be changed after creation. Reassigning is done by sending a new assigneeId.
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    description: z.string().trim(),
    assigneeId: objectId,
    priority: z.enum(PRIORITIES),
    dueDate: z.coerce.date(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update");

export const changeStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
  reason: z.string().trim().optional(),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
});

/** Query string for GET /tasks: search + filters + pagination. */
export const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignee: objectId.optional(),
  project: objectId.optional(),
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),
  overdue: z.enum(["true", "false"]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
