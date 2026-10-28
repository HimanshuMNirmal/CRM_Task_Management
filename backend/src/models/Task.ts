import { Schema, model, type Types } from "mongoose";
import { PRIORITIES, TASK_STATUSES, type Priority, type TaskStatus } from "../constants";

export interface IAttachment {
  originalName: string;
  /** Name of the file on disk (random, so it cannot be guessed). */
  fileName: string;
  url: string;
  size: number;
}

export interface ITask {
  title: string;
  description: string;
  project: Types.ObjectId;
  /** Copied from the project when the task is created. Makes "own team" checks a simple field compare. */
  team: Types.ObjectId;
  assignee: Types.ObjectId;
  priority: Priority;
  dueDate: Date;
  status: TaskStatus;
  attachments: IAttachment[];
  createdBy: Types.ObjectId;
  /** True once the "due within 24 hours" notification has been sent. */
  dueSoonNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    priority: { type: String, enum: PRIORITIES, default: "MEDIUM" },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: TASK_STATUSES, default: "TODO" },
    attachments: { type: [attachmentSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueSoonNotified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const TaskModel = model<ITask>("Task", taskSchema);
