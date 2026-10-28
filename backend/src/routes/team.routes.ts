import { Router } from "express";
import * as controller from "../controllers/team.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

export const teamRoutes = Router();
teamRoutes.use(authenticate);

// Any logged-in user may read THEIR OWN team (the service enforces this).
teamRoutes.get("/:id", controller.getOne);

// Managing teams is Admin only.
teamRoutes.get("/", requireRole("ADMIN"), controller.list);
teamRoutes.post("/", requireRole("ADMIN"), controller.create);
teamRoutes.patch("/:id", requireRole("ADMIN"), controller.rename);
teamRoutes.put("/:id/members", requireRole("ADMIN"), controller.setMembers);
