// Fills the database with demo data: 1 admin, 2 managers (2 teams), 3 employees, projects and tasks.
// Run with:  npm run seed      (WARNING: it deletes existing data first)
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../config/db";
import type { Priority, TaskStatus } from "../constants";
import { ActivityModel } from "../models/Activity";
import { CommentModel } from "../models/Comment";
import { NotificationModel } from "../models/Notification";
import { ProjectModel } from "../models/Project";
import { RevokedTokenModel } from "../models/RevokedToken";
import { TaskModel } from "../models/Task";
import { TeamModel } from "../models/Team";
import { UserModel } from "../models/User";

const SEED_PASSWORD = "Password@123";
const DAY = 24 * 60 * 60 * 1000;
const fromNow = (ms: number) => new Date(Date.now() + ms);

async function seed(): Promise<void> {
  await connectDb();

  // 1. Start from an empty database
  await ActivityModel.deleteMany({});
  await CommentModel.deleteMany({});
  await NotificationModel.deleteMany({});
  await ProjectModel.deleteMany({});
  await RevokedTokenModel.deleteMany({});
  await TaskModel.deleteMany({});
  await TeamModel.deleteMany({});
  await UserModel.deleteMany({});

  // 2. Teams
  const [alpha, beta] = await TeamModel.create([{ name: "Team Alpha" }, { name: "Team Beta" }]);
  if (!alpha || !beta) throw new Error("Could not create teams");

  // 3. Users (every account uses the same demo password)
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const [admin, manager1, manager2, employee1, employee2, employee3] = await UserModel.create([
    { name: "Alice Admin", email: "admin@example.com", role: "ADMIN", passwordHash },
    { name: "Mark Manager", email: "manager1@example.com", role: "MANAGER", team: alpha._id, passwordHash },
    { name: "Meera Manager", email: "manager2@example.com", role: "MANAGER", team: beta._id, passwordHash },
    { name: "Eli Employee", email: "employee1@example.com", role: "EMPLOYEE", team: alpha._id, passwordHash },
    { name: "Esha Employee", email: "employee2@example.com", role: "EMPLOYEE", team: alpha._id, passwordHash },
    { name: "Ethan Employee", email: "employee3@example.com", role: "EMPLOYEE", team: beta._id, passwordHash },
  ]);
  if (!admin || !manager1 || !manager2 || !employee1 || !employee2 || !employee3) throw new Error("Could not create users");

  // 4. Projects
  const [website, mobile, crm] = await ProjectModel.create([
    { name: "Website Redesign", description: "New marketing site", clientName: "Acme Corp", startDate: fromNow(-30 * DAY), endDate: fromNow(30 * DAY), status: "ACTIVE", team: alpha._id, createdBy: manager1._id },
    { name: "Mobile App MVP", description: "First release of the mobile app", clientName: "Globex", startDate: fromNow(-10 * DAY), endDate: fromNow(60 * DAY), status: "ACTIVE", team: alpha._id, createdBy: manager1._id },
    { name: "CRM Migration", description: "Move customers to the new CRM", clientName: "Initech", startDate: fromNow(-20 * DAY), endDate: fromNow(45 * DAY), status: "ACTIVE", team: beta._id, createdBy: manager2._id },
  ]);
  if (!website || !mobile || !crm) throw new Error("Could not create projects");

  // 5. Tasks. Some are overdue, one is due in 12 hours (triggers a "due soon" notification).
  type Seed = { title: string; project: typeof website; assignee: typeof employee1; manager: typeof manager1; priority: Priority; status: TaskStatus; due: Date };
  const seeds: Seed[] = [
    { title: "Design homepage mockup", project: website, assignee: employee1, manager: manager1, priority: "HIGH", status: "DONE", due: fromNow(-5 * DAY) },
    { title: "Build navigation component", project: website, assignee: employee1, manager: manager1, priority: "MEDIUM", status: "IN_PROGRESS", due: fromNow(2 * DAY) },
    { title: "Write landing page copy", project: website, assignee: employee2, manager: manager1, priority: "HIGH", status: "IN_REVIEW", due: fromNow(12 * 60 * 60 * 1000) },
    { title: "Fix mobile layout bugs", project: website, assignee: employee2, manager: manager1, priority: "URGENT", status: "TODO", due: fromNow(-2 * DAY) },
    { title: "Set up CI pipeline", project: mobile, assignee: employee1, manager: manager1, priority: "LOW", status: "TODO", due: fromNow(7 * DAY) },
    { title: "Implement login screen", project: mobile, assignee: employee2, manager: manager1, priority: "HIGH", status: "IN_PROGRESS", due: fromNow(4 * DAY) },
    { title: "Prepare app store screenshots", project: mobile, assignee: employee1, manager: manager1, priority: "MEDIUM", status: "IN_REVIEW", due: fromNow(3 * DAY) },
    { title: "Export legacy customer data", project: crm, assignee: employee3, manager: manager2, priority: "URGENT", status: "IN_PROGRESS", due: fromNow(3 * DAY) },
    { title: "Map old fields to new CRM fields", project: crm, assignee: employee3, manager: manager2, priority: "HIGH", status: "TODO", due: fromNow(-1 * DAY) },
    { title: "Create user training deck", project: crm, assignee: employee3, manager: manager2, priority: "LOW", status: "DONE", due: fromNow(-3 * DAY) },
  ];

  for (const s of seeds) {
    const task = await TaskModel.create({
      title: s.title,
      description: `Demo task for "${s.project.name}".`,
      project: s.project._id,
      team: s.project.team,
      assignee: s.assignee._id,
      priority: s.priority,
      status: s.status,
      dueDate: s.due,
      createdBy: s.manager._id,
    });
    await ActivityModel.create({ task: task._id, actor: s.manager._id, action: "TASK_CREATED", message: `Created the task and assigned it to ${s.assignee.name}` });
    if (s.status !== "TODO") {
      await ActivityModel.create({ task: task._id, actor: s.assignee._id, action: "STATUS_CHANGED", message: `Changed status from To Do to ${s.status === "DONE" ? "Done" : s.status === "IN_REVIEW" ? "In Review" : "In Progress"}` });
    }
    await NotificationModel.create({ user: s.assignee._id, task: task._id, type: "TASK_ASSIGNED", message: `You were assigned a task: "${task.title}"` });
    if (s.status === "IN_PROGRESS") {
      await CommentModel.create({ task: task._id, author: s.assignee._id, text: "Started working on this, will update soon." });
    }
  }

  console.log("\nSeed complete. Log in with any of these accounts:\n");
  console.log(`  Admin     admin@example.com      / ${SEED_PASSWORD}`);
  console.log(`  Manager   manager1@example.com   / ${SEED_PASSWORD}   (Team Alpha)`);
  console.log(`  Manager   manager2@example.com   / ${SEED_PASSWORD}   (Team Beta)`);
  console.log(`  Employee  employee1@example.com  / ${SEED_PASSWORD}   (Team Alpha)`);
  console.log(`  Employee  employee2@example.com  / ${SEED_PASSWORD}   (Team Alpha)`);
  console.log(`  Employee  employee3@example.com  / ${SEED_PASSWORD}   (Team Beta)\n`);
}

seed()
  .catch((err: unknown) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
