import type { Types } from "mongoose";
import { TeamModel } from "../models/Team";
import { UserModel } from "../models/User";
import type { AuthUser } from "../types";
import { AppError } from "../utils/AppError";
import { toObjectId } from "../utils/helpers";
import type { TeamMembersInput } from "../validators/team.validators";

interface Member {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

/** Builds the response shape: the team plus its manager and employees. */
function buildTeamView(team: { _id: Types.ObjectId; name: string }, members: Member[]) {
  return {
    _id: team._id,
    name: team.name,
    manager: members.find((m) => m.role === "MANAGER") ?? null,
    employees: members.filter((m) => m.role === "EMPLOYEE"),
  };
}

async function findMembers(teamIds: Types.ObjectId[]) {
  return UserModel.find({ team: { $in: teamIds } })
    .select("name email role isActive team")
    .sort({ name: 1 })
    .lean();
}

export async function listTeams() {
  const teams = await TeamModel.find().sort({ name: 1 }).lean();
  const members = await findMembers(teams.map((t) => t._id));
  return teams.map((team) =>
    buildTeamView(
      team,
      members.filter((m) => m.team?.toString() === team._id.toString()),
    ),
  );
}

async function getTeamView(teamId: Types.ObjectId) {
  const team = await TeamModel.findById(teamId).lean();
  if (!team) throw AppError.notFound("Team not found");
  return buildTeamView(team, await findMembers([team._id]));
}

/** Admins can view any team; managers and employees can only view the team they belong to. */
export async function getTeam(user: AuthUser, id: string) {
  if (user.role !== "ADMIN" && user.teamId !== id) throw AppError.forbidden("You can only view your own team");
  return getTeamView(toObjectId(id, "team id"));
}

export async function createTeam(name: string) {
  if (await TeamModel.exists({ name })) throw AppError.conflict("A team with this name already exists");
  const team = await TeamModel.create({ name });
  return getTeamView(team._id);
}

export async function renameTeam(id: string, name: string) {
  const team = await TeamModel.findByIdAndUpdate(toObjectId(id, "team id"), { name }, { new: true });
  if (!team) throw AppError.notFound("Team not found");
  return getTeamView(team._id);
}

/**
 * Replaces the team's members with exactly one manager + the given employees.
 * People who were in the team but are not in the list are removed from it.
 */
export async function setTeamMembers(id: string, input: TeamMembersInput) {
  const teamId = toObjectId(id, "team id");
  if (!(await TeamModel.exists({ _id: teamId }))) throw AppError.notFound("Team not found");

  const allIds = [input.managerId, ...input.employeeIds];
  if (new Set(allIds).size !== allIds.length) throw AppError.badRequest("A user was listed more than once");

  const users = await UserModel.find({ _id: { $in: allIds } });
  if (users.length !== allIds.length) throw AppError.badRequest("One or more users do not exist");

  for (const user of users) {
    const expectedRole = user.id === input.managerId ? "MANAGER" : "EMPLOYEE";
    if (user.role !== expectedRole) {
      throw AppError.badRequest(`${user.name} is a ${user.role}, but was added as a ${expectedRole}`);
    }
    if (!user.isActive) throw AppError.badRequest(`${user.name} is deactivated`);
    if (user.team && user.team.toString() !== id) {
      throw AppError.conflict(`${user.name} already belongs to another team`);
    }
  }

  await UserModel.updateMany({ team: teamId, _id: { $nin: allIds } }, { team: null });
  await UserModel.updateMany({ _id: { $in: allIds } }, { team: teamId });

  return getTeamView(teamId);
}
