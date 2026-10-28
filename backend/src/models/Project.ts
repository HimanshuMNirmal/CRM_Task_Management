import { Schema, model, type Types } from "mongoose";
import { PROJECT_STATUSES, type ProjectStatus } from "../constants";

export interface IProject {
  name: string;
  description: string;
  clientName: string;
  startDate: Date;
  endDate: Date;
  status: ProjectStatus;
  /** A project belongs to exactly one team. */
  team: Types.ObjectId;
  createdBy: Types.ObjectId;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    clientName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: PROJECT_STATUSES, default: "PLANNED" },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const ProjectModel = model<IProject>("Project", projectSchema);
