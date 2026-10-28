import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

export const userRoutes = Router();
userRoutes.use(authenticate);

// Managers need this list to pick an assignee when creating tasks.
userRoutes.get("/assignable", requireRole("ADMIN", "MANAGER"), controller.assignable);

// Everything below is Admin only ("Manage users and teams").
userRoutes.use(requireRole("ADMIN"));
userRoutes.get("/", controller.list);
userRoutes.post("/", controller.create);
userRoutes.patch("/:id", controller.update);
