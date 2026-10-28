import type { Types } from "mongoose";
import { CommentModel } from "../models/Comment";
import type { AuthUser } from "../types";
import { assertCanCommentOnTask, assertCanViewTask } from "./task.service";

type AuthorRef = { _id: Types.ObjectId; name: string; role: string };

export async function listComments(user: AuthUser, taskId: string) {
  await assertCanViewTask(user, taskId);
  return CommentModel.find({ task: taskId }).populate<{ author: AuthorRef }>("author", "name role").sort({ createdAt: 1 }).lean();
}

export async function addComment(user: AuthUser, taskId: string, text: string) {
  await assertCanCommentOnTask(user, taskId);
  const comment = await CommentModel.create({ task: taskId, author: user.id, text });
  return CommentModel.findById(comment._id).populate<{ author: AuthorRef }>("author", "name role").lean();
}
