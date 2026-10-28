import type { Types } from "mongoose";
import type { NotificationType } from "../constants";
import { NotificationModel } from "../models/Notification";
import { AppError } from "../utils/AppError";
import { toObjectId } from "../utils/helpers";

/**
 * Creates one notification per recipient.
 * `excludeUserId` is the person who did the action - they don't need to be told about their own action.
 */
export async function notifyUsers(
  recipients: Array<Types.ObjectId | string>,
  taskId: Types.ObjectId | string,
  type: NotificationType,
  message: string,
  excludeUserId?: string,
): Promise<void> {
  const uniqueIds = [...new Set(recipients.map(String))].filter((id) => id !== excludeUserId);
  if (uniqueIds.length === 0) return;
  await NotificationModel.insertMany(uniqueIds.map((user) => ({ user, task: taskId, type, message })));
}

export async function listNotifications(userId: string) {
  const [items, unreadCount] = await Promise.all([
    NotificationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
    NotificationModel.countDocuments({ user: userId, read: false }),
  ]);
  return { items, unreadCount };
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  const result = await NotificationModel.updateOne(
    { _id: toObjectId(notificationId, "notification id"), user: userId }, // user check: only your own
    { read: true },
  );
  if (result.matchedCount === 0) throw AppError.notFound("Notification not found");
}

export async function markAllAsRead(userId: string): Promise<void> {
  await NotificationModel.updateMany({ user: userId, read: false }, { read: true });
}
