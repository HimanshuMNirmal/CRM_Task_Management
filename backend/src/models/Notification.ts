import { Schema, model, type Types } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "../constants";

export interface INotification {
  user: Types.ObjectId;
  task: Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const NotificationModel = model<INotification>("Notification", notificationSchema);
