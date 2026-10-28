import { Router } from "express";
import * as controller from "../controllers/notification.controller";
import { authenticate } from "../middleware/authenticate";

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);

notificationRoutes.get("/", controller.list);
notificationRoutes.patch("/read-all", controller.markAllRead); // before "/:id/read"
notificationRoutes.patch("/:id/read", controller.markRead);
