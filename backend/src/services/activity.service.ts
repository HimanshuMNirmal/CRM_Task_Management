import type { Types } from "mongoose";
import type { ActivityAction } from "../constants";
import { ActivityModel } from "../models/Activity";

/** Records "who did what" on a task. Shown on the task detail page. */
export async function logActivity(
  taskId: Types.ObjectId | string,
  actorId: Types.ObjectId | string,
  action: ActivityAction,
  message: string,
): Promise<void> {
  await ActivityModel.create({ task: taskId, actor: actorId, action, message });
}

export async function listActivity(taskId: Types.ObjectId | string) {
  return ActivityModel.find({ task: taskId })
    .populate<{ actor: { _id: Types.ObjectId; name: string; role: string } }>("actor", "name role")
    .sort({ createdAt: -1 })
    .lean();
}
