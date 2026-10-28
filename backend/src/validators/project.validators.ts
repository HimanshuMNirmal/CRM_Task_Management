import { z } from "zod";
import { PROJECT_STATUSES } from "../constants";
import { objectId } from "./common";

const projectFields = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters"),
  description: z.string().trim().default(""),
  clientName: z.string().trim().min(2, "Client name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(PROJECT_STATUSES).default("PLANNED"),
});

export const createProjectSchema = projectFields
  .extend({
    // Managers always create projects for their own team. Admins must say which team.
    teamId: objectId.optional(),
  })
  .refine((p) => p.endDate >= p.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

// For updates every field is optional (the date order is re-checked in the service).
export const updateProjectSchema = projectFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update");

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
