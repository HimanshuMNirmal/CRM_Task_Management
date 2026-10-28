import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";

export const authRoutes = Router();

authRoutes.post("/login", controller.login);
authRoutes.post("/logout", authenticate, controller.logout);
authRoutes.get("/me", authenticate, controller.me);
