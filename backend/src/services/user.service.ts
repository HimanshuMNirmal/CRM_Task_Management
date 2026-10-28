import bcrypt from "bcryptjs";
import type { QueryFilter, Types } from "mongoose";
import type { Role } from "../constants";
import { UserModel, type IUser } from "../models/User";
import type { AuthUser } from "../types";
import type { CreateUserInput, UpdateUserInput } from "../validators/user.validators";
import { AppError } from "../utils/AppError";
import { toObjectId } from "../utils/helpers";
import { toPublicUser } from "./auth.service";

type TeamRef = { _id: Types.ObjectId; name: string } | null;

/** Admin: list users (optionally by role), with their team name. */
export async function listUsers(role?: Role) {
  const filter: QueryFilter<IUser> = role ? { role } : {};
  return UserModel.find(filter).populate<{ team: TeamRef }>("team", "name").sort({ name: 1 }).lean();
}

/** People a task can be assigned to: active employees (a manager only sees their own team). */
export async function listAssignable(user: AuthUser) {
  const filter: QueryFilter<IUser> = { role: "EMPLOYEE", isActive: true, team: { $ne: null } };
  if (user.role === "MANAGER") filter.team = user.teamId ? toObjectId(user.teamId) : null;
  return UserModel.find(filter).select("name email team").sort({ name: 1 }).lean();
}

export async function createUser(input: CreateUserInput) {
  const exists = await UserModel.exists({ email: input.email });
  if (exists) throw AppError.conflict("A user with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash,
  });
  return toPublicUser(user);
}

export async function updateUser(actor: AuthUser, userId: string, input: UpdateUserInput) {
  const user = await UserModel.findById(toObjectId(userId, "user id"));
  if (!user) throw AppError.notFound("User not found");

  const isSelf = actor.id === user.id;
  if (isSelf && input.isActive === false) throw AppError.badRequest("You cannot deactivate your own account");
  if (isSelf && input.role && input.role !== user.role) throw AppError.badRequest("You cannot change your own role");

  // Roles are tied to team membership (one manager per team), so remove them from the team first.
  if (input.role && input.role !== user.role && user.team) {
    throw AppError.conflict("Remove this user from their team before changing their role");
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.role !== undefined) user.role = input.role;
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.password !== undefined) user.passwordHash = await bcrypt.hash(input.password, 10);

  await user.save();
  return toPublicUser(user);
}
