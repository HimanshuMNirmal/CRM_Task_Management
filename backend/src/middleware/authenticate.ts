import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth.service";
import { AppError } from "../utils/AppError";

/** Protects a route: requires a valid, non-revoked `Authorization: Bearer <token>` header. */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw AppError.unauthorized();

  const { user, token } = await verifyToken(header.slice("Bearer ".length));
  req.user = user;
  req.token = token;
  next();
}
