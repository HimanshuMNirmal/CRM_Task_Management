import type { NextFunction, Request, Response } from "express";
import type { Role } from "../constants";
import { AppError } from "../utils/AppError";

/**
 * Role gate for a route, e.g. `router.use(requireRole("ADMIN"))`.
 * Must be placed after `authenticate`.
 * Finer rules (own team, own task) live in policies/taskPolicy.ts and are applied in the services.
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw AppError.unauthorized();
    if (!allowed.includes(req.user.role)) {
      throw AppError.forbidden(`This action requires one of these roles: ${allowed.join(", ")}`);
    }
    next();
  };
}

/** Returns the logged-in user or throws 401. Saves us from `req.user!` everywhere. */
export function currentUser(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}
