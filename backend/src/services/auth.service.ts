import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";
import type { Role } from "../constants";
import { RevokedTokenModel } from "../models/RevokedToken";
import { UserModel, type IUser } from "../models/User";
import type { AuthUser } from "../types";
import { AppError } from "../utils/AppError";

/** The user fields that are safe to send to the browser (never the password hash). */
export interface PublicUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  team: string | null;
  isActive: boolean;
}

type UserDoc = IUser & { id: string };

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team ? user.team.toString() : null,
    isActive: user.isActive,
  };
}

export async function login(email: string, password: string) {
  // passwordHash is hidden by default, so we ask for it explicitly here.
  const user = await UserModel.findOne({ email }).select("+passwordHash");

  // Same message for "unknown email" and "wrong password" so attackers can't tell which one failed.
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches) throw AppError.unauthorized("Invalid email or password");
  if (!user.isActive) throw AppError.forbidden("This account has been deactivated");

  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    jwtid: randomUUID(), // unique id so we can revoke this exact token on logout
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"], // e.g. "8h"
  });

  return { token, user: toPublicUser(user) };
}

/** Checks the JWT and loads the user fresh from the database. */
export async function verifyToken(token: string): Promise<{ user: AuthUser; token: { jti: string; exp: number } }> {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
  if (typeof payload === "string" || !payload.sub || !payload.jti || !payload.exp) {
    throw AppError.unauthorized("Invalid token");
  }

  if (await RevokedTokenModel.exists({ jti: payload.jti })) {
    throw AppError.unauthorized("You have been logged out. Please log in again");
  }

  // Loading the user on every request means role changes and deactivation apply immediately.
  const user = await UserModel.findById(payload.sub);
  if (!user || !user.isActive) throw AppError.unauthorized("Account not found or deactivated");

  return {
    user: { id: user.id, role: user.role, teamId: user.team ? user.team.toString() : null },
    token: { jti: payload.jti, exp: payload.exp },
  };
}

export async function logout(token: { jti: string; exp: number }): Promise<void> {
  await RevokedTokenModel.updateOne(
    { jti: token.jti },
    { jti: token.jti, expiresAt: new Date(token.exp * 1000) },
    { upsert: true },
  );
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId);
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}
