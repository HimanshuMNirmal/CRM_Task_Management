import type { Request, Response } from "express";
import { currentUser } from "../middleware/authorize";
import * as activityService from "../services/activity.service";
import * as commentService from "../services/comment.service";
import * as taskService from "../services/task.service";
import {
  changeStatusSchema,
  commentSchema,
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
} from "../validators/task.validators";

const idOf = (req: Request): string => String(req.params.id);

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await taskService.listTasks(currentUser(req), taskQuerySchema.parse(req.query)));
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const csv = await taskService.exportTasksCsv(currentUser(req), taskQuerySchema.parse(req.query));
  res.header("Content-Type", "text/csv").attachment("tasks.csv").send(csv);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  res.json(await taskService.getTask(currentUser(req), idOf(req)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const task = await taskService.createTask(currentUser(req), createTaskSchema.parse(req.body));
  res.status(201).json(task);
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateTaskSchema.parse(req.body);
  res.json(await taskService.updateTask(currentUser(req), idOf(req), input));
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  const input = changeStatusSchema.parse(req.body);
  res.json(await taskService.changeStatus(currentUser(req), idOf(req), input));
}

export async function addAttachment(req: Request, res: Response): Promise<void> {
  const task = await taskService.addAttachment(currentUser(req), idOf(req), req.file);
  res.status(201).json(task);
}

export async function listComments(req: Request, res: Response): Promise<void> {
  res.json(await commentService.listComments(currentUser(req), idOf(req)));
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const { text } = commentSchema.parse(req.body);
  res.status(201).json(await commentService.addComment(currentUser(req), idOf(req), text));
}

export async function listActivity(req: Request, res: Response): Promise<void> {
  await taskService.assertCanViewTask(currentUser(req), idOf(req));
  res.json(await activityService.listActivity(idOf(req)));
}
