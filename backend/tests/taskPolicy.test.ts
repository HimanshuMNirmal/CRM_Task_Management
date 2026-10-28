// Unit tests for the access-control matrix and the status workflow.
// These run without a database because the policy functions are pure.
import { describe, expect, it } from "vitest";
import {
  allowedStatuses,
  canCommentOnTask,
  canCreateProject,
  canCreateTask,
  canEditTask,
  canViewTask,
  checkStatusChange,
  isValidAssignee,
  type TaskFacts,
} from "../src/policies/taskPolicy";
import type { AuthUser } from "../src/types";

const admin: AuthUser = { id: "admin", role: "ADMIN", teamId: null };
const managerA: AuthUser = { id: "mgrA", role: "MANAGER", teamId: "teamA" };
const managerB: AuthUser = { id: "mgrB", role: "MANAGER", teamId: "teamB" };
const employeeA1: AuthUser = { id: "empA1", role: "EMPLOYEE", teamId: "teamA" };
const employeeA2: AuthUser = { id: "empA2", role: "EMPLOYEE", teamId: "teamA" };

/** A task in team A, assigned to employeeA1. */
const task = (status: TaskFacts["status"] = "TODO"): TaskFacts => ({ teamId: "teamA", assigneeId: "empA1", status });

describe("viewing and commenting", () => {
  it("admin sees everything", () => {
    expect(canViewTask(admin, task())).toBe(true);
  });
  it("manager sees only their own team's tasks", () => {
    expect(canViewTask(managerA, task())).toBe(true);
    expect(canViewTask(managerB, task())).toBe(false);
  });
  it("employee sees only tasks assigned to them", () => {
    expect(canViewTask(employeeA1, task())).toBe(true);
    expect(canViewTask(employeeA2, task())).toBe(false);
  });
  it("commenting follows the same scope as viewing", () => {
    expect(canCommentOnTask(managerA, task())).toBe(true);
    expect(canCommentOnTask(managerB, task())).toBe(false);
    expect(canCommentOnTask(employeeA2, task())).toBe(false);
  });
});

describe("creating and editing", () => {
  it("only admin and managers can create projects", () => {
    expect(canCreateProject(admin)).toBe(true);
    expect(canCreateProject(managerA)).toBe(true);
    expect(canCreateProject(employeeA1)).toBe(false);
  });
  it("managers can create tasks only in their own team's projects", () => {
    expect(canCreateTask(admin, "teamB")).toBe(true);
    expect(canCreateTask(managerA, "teamA")).toBe(true);
    expect(canCreateTask(managerA, "teamB")).toBe(false);
    expect(canCreateTask(employeeA1, "teamA")).toBe(false);
  });
  it("employees can never edit task details", () => {
    expect(canEditTask(employeeA1, task())).toBe(false);
    expect(canEditTask(managerA, task())).toBe(true);
    expect(canEditTask(managerB, task())).toBe(false);
    expect(canEditTask(admin, task())).toBe(true);
  });
  it("tasks can only be assigned to active employees of the same team", () => {
    expect(isValidAssignee({ role: "EMPLOYEE", isActive: true, teamId: "teamA" }, "teamA")).toBe(true);
    expect(isValidAssignee({ role: "EMPLOYEE", isActive: true, teamId: "teamB" }, "teamA")).toBe(false);
    expect(isValidAssignee({ role: "EMPLOYEE", isActive: false, teamId: "teamA" }, "teamA")).toBe(false);
    expect(isValidAssignee({ role: "MANAGER", isActive: true, teamId: "teamA" }, "teamA")).toBe(false);
  });
});

describe("status workflow - employee", () => {
  it("can move To Do -> In Progress -> In Review on their own task", () => {
    expect(checkStatusChange(employeeA1, task("TODO"), "IN_PROGRESS").ok).toBe(true);
    expect(checkStatusChange(employeeA1, task("IN_PROGRESS"), "IN_REVIEW").ok).toBe(true);
  });
  it("cannot mark a task Done", () => {
    const result = checkStatusChange(employeeA1, task("IN_REVIEW"), "DONE");
    expect(result).toMatchObject({ ok: false, statusCode: 403 });
  });
  it("cannot skip a step", () => {
    expect(checkStatusChange(employeeA1, task("TODO"), "IN_REVIEW").ok).toBe(false);
  });
  it("cannot move a task backwards or out of review", () => {
    expect(checkStatusChange(employeeA1, task("IN_PROGRESS"), "TODO").ok).toBe(false);
    expect(checkStatusChange(employeeA1, task("IN_REVIEW"), "IN_PROGRESS").ok).toBe(false);
  });
  it("cannot change someone else's task", () => {
    expect(checkStatusChange(employeeA2, task("TODO"), "IN_PROGRESS")).toMatchObject({ ok: false, statusCode: 403 });
  });
});

describe("status workflow - manager and admin", () => {
  it("manager can mark Done on their own team's task", () => {
    expect(checkStatusChange(managerA, task("IN_REVIEW"), "DONE").ok).toBe(true);
  });
  it("manager cannot change another team's task", () => {
    expect(checkStatusChange(managerB, task("IN_REVIEW"), "DONE")).toMatchObject({ ok: false, statusCode: 403 });
  });
  it("sending a task back from In Review needs a reason", () => {
    expect(checkStatusChange(managerA, task("IN_REVIEW"), "IN_PROGRESS")).toMatchObject({ ok: false, statusCode: 400 });
    expect(checkStatusChange(managerA, task("IN_REVIEW"), "IN_PROGRESS", "   ")).toMatchObject({ ok: false, statusCode: 400 });
    expect(checkStatusChange(managerA, task("IN_REVIEW"), "IN_PROGRESS", "Copy needs a rewrite").ok).toBe(true);
  });
  it("admin can set any status", () => {
    expect(checkStatusChange(admin, task("TODO"), "DONE").ok).toBe(true);
  });
  it("setting the same status is rejected", () => {
    expect(checkStatusChange(admin, task("TODO"), "TODO")).toMatchObject({ ok: false, statusCode: 400 });
  });
});

describe("allowedStatuses (used by the UI to show buttons)", () => {
  it("employee gets only the next step", () => {
    expect(allowedStatuses(employeeA1, task("TODO"))).toEqual(["IN_PROGRESS"]);
    expect(allowedStatuses(employeeA1, task("IN_REVIEW"))).toEqual([]);
  });
  it("manager gets every other status", () => {
    expect(allowedStatuses(managerA, task("IN_REVIEW"))).toEqual(["TODO", "IN_PROGRESS", "DONE"]);
  });
  it("manager of another team gets nothing", () => {
    expect(allowedStatuses(managerB, task("TODO"))).toEqual([]);
  });
});
