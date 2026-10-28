import { z } from "zod";
import { objectId } from "./common";

export const teamNameSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters"),
});

export const teamMembersSchema = z.object({
  managerId: objectId,
  employeeIds: z.array(objectId),
});

export type TeamMembersInput = z.infer<typeof teamMembersSchema>;
