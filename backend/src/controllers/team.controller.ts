import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import * as teamService from "../services/team.service";
import { teamMembersSchema, teamNameSchema } from "../validators/team.validators";

export async function list(_req: Request, res: Response): Promise<void> {
  res.json(await teamService.listTeams());
}

export async function getOne(req: Request, res: Response): Promise<void> {
  res.json(await teamService.getTeam(currentUser(req), String(req.params.id)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name } = teamNameSchema.parse(req.body);
  res.status(201).json(await teamService.createTeam(name));
}

export async function rename(req: Request, res: Response): Promise<void> {
  const { name } = teamNameSchema.parse(req.body);
  res.json(await teamService.renameTeam(String(req.params.id), name));
}

export async function setMembers(req: Request, res: Response): Promise<void> {
  const input = teamMembersSchema.parse(req.body);
  res.json(await teamService.setTeamMembers(String(req.params.id), input));
}
