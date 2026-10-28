import { Router } from "express";
import * as controller from "../controllers/project.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

export const projectRoutes = Router();

// Employees have no access to the projects API. "Own team" checks are done in the service.
projectRoutes.use(authenticate, requireRole("ADMIN", "MANAGER"));

projectRoutes.get("/", controller.list);
projectRoutes.post("/", controller.create);
projectRoutes.get("/:id", controller.getOne);
projectRoutes.patch("/:id", controller.update);
