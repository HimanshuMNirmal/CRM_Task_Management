import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import * as userService from "../services/user.service";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "../validators/user.validators";

export async function list(req: Request, res: Response): Promise<void> {
  const { role } = listUsersQuerySchema.parse(req.query);
  res.json(await userService.listUsers(role));
}

export async function assignable(req: Request, res: Response): Promise<void> {
  res.json(await userService.listAssignable(currentUser(req)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = await userService.createUser(createUserSchema.parse(req.body));
  res.status(201).json(user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateUserSchema.parse(req.body);
  res.json(await userService.updateUser(currentUser(req), String(req.params.id), input));
}
