import { Types } from "mongoose";
import { AppError } from "./AppError";

/** Converts a string id from a request into an ObjectId, or throws a 400. */
export function toObjectId(id: string, label = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw AppError.badRequest(`Invalid ${label}`);
  return new Types.ObjectId(id);
}

/** Escapes user input so it can safely be used inside a RegExp. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
