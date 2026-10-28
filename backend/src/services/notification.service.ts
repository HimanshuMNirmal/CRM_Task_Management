import type { Types } from "mongoose";
import type { NotificationType } from "../constants";
import { NotificationModel } from "../models/Notification";
import { emitToUser } from "../realtime/socket";
import { AppError } from "../utils/AppError";
import { toObjectId } from "../utils/helpers";

interface NewNotification {
  user: Types.ObjectId | string;
  task: Types.ObjectId | string;
  type: NotificationType;
  message: string;
}

/** Saves the notifications and pushes each one to its recipient's open tabs ("notification:new"). */
export async function createNotifications(rows: NewNotification[]): Promise<void> {
  if (rows.length === 0) return;
  const saved = await NotificationModel.insertMany(rows);
  for (const doc of saved) emitToUser(String(doc.user), "notification:new", doc.toJSON());
}

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
  await createNotifications(uniqueIds.map((user) => ({ user, task: taskId, type, message })));
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
  emitToUser(userId, "notifications:updated", null); // keeps the user's other tabs in sync
}

export async function markAllAsRead(userId: string): Promise<void> {
  await NotificationModel.updateMany({ user: userId, read: false }, { read: true });
  emitToUser(userId, "notifications:updated", null);
}
