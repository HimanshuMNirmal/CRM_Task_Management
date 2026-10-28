import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { Error as MongooseError } from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Last middleware in the chain: converts any error into a JSON response with a sensible status code. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Zod validation failure -> 400 with a message per field
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
    const message = errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join("; ");
    res.status(400).json({ message, errors });
    return;
  }

  // File upload problems (e.g. file too large)
  if (err instanceof MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }

  // Bad ObjectId etc.
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ message: `Invalid value for "${err.path}"` });
    return;
  }

  // Duplicate key (e.g. email already used)
  if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
    res.status(409).json({ message: "A record with the same unique value already exists" });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}
