import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { notificationRoutes } from "./notification.routes";
import { projectRoutes } from "./project.routes";
import { taskRoutes } from "./task.routes";
import { teamRoutes } from "./team.routes";
import { userRoutes } from "./user.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/teams", teamRoutes);
apiRouter.use("/projects", projectRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
