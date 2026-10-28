import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import * as notificationService from "../services/notification.service";

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await notificationService.listNotifications(currentUser(req).id));
}

export async function markRead(req: Request, res: Response): Promise<void> {
  await notificationService.markAsRead(currentUser(req).id, String(req.params.id));
  res.json({ message: "Marked as read" });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await notificationService.markAllAsRead(currentUser(req).id);
  res.json({ message: "All notifications marked as read" });
}
