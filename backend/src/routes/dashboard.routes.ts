import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/authenticate";

export const dashboardRoutes = Router();
dashboardRoutes.get("/", authenticate, controller.get);
