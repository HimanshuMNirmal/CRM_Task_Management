import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import { getDashboard } from "../services/dashboard.service";

export async function get(req: Request, res: Response): Promise<void> {
  res.json(await getDashboard(currentUser(req)));
}
