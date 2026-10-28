import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import * as projectService from "../services/project.service";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validators";

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await projectService.listProjects(currentUser(req)));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  res.json(await projectService.getProject(currentUser(req), String(req.params.id)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createProjectSchema.parse(req.body);
  res.status(201).json(await projectService.createProject(currentUser(req), input));
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateProjectSchema.parse(req.body);
  res.json(await projectService.updateProject(currentUser(req), String(req.params.id), input));
}
