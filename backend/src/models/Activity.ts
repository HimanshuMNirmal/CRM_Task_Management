import { Schema, model, type Types } from "mongoose";
import { ACTIVITY_ACTIONS, type ActivityAction } from "../constants";

// One row per important thing that happens to a task: who did it, what, and when.
export interface IActivity {
  task: Types.ObjectId;
  actor: Types.ObjectId;
  action: ActivityAction;
  message: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ActivityModel = model<IActivity>("Activity", activitySchema);
