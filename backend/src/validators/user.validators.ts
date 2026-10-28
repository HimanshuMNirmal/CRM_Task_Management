import { z } from "zod";
import { ROLES } from "../constants";
import { objectId } from "./common";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLES),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2),
    role: z.enum(ROLES),
    isActive: z.boolean(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update");

export const listUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
});

export const reassignTasksSchema = z.object({
  assigneeId: objectId,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
