import type { AuthUser } from "./index";

// Adds `req.user` to Express's Request type.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: { jti: string; exp: number };
    }
  }
}

export {};
