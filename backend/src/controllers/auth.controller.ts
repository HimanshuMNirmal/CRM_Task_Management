import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import * as authService from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { loginSchema } from "../validators/auth.validators";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);
  res.json(await authService.login(email, password));
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.token) throw AppError.unauthorized();
  await authService.logout(req.token);
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json(await authService.getProfile(currentUser(req).id));
}
