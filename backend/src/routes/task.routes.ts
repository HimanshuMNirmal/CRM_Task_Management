import { Router } from "express";
import * as controller from "../controllers/task.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { upload } from "../middleware/upload";

export const taskRoutes = Router();
taskRoutes.use(authenticate);

// Role gate first (cheap); the "own team / own task" rules run inside the services.
taskRoutes.get("/", controller.list); // the service limits what each role sees
taskRoutes.get("/export", controller.exportCsv); // must be declared before "/:id"
taskRoutes.post("/", requireRole("ADMIN", "MANAGER"), controller.create);

taskRoutes.get("/:id", controller.getOne);
taskRoutes.patch("/:id", requireRole("ADMIN", "MANAGER"), controller.update);
taskRoutes.patch("/:id/status", controller.changeStatus); // employees allowed, within the workflow rules
taskRoutes.post("/:id/attachments", requireRole("ADMIN", "MANAGER"), upload.single("file"), controller.addAttachment);

taskRoutes.get("/:id/comments", controller.listComments);
taskRoutes.post("/:id/comments", controller.addComment);
taskRoutes.get("/:id/activity", controller.listActivity);
