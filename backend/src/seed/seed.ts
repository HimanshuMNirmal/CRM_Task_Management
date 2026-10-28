// Seeds the initial admin account: admin@crm.com / admin123
// Run with:  npm run seed      (WARNING: resets existing data)
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../config/db";
import { ActivityModel } from "../models/Activity";
import { CommentModel } from "../models/Comment";
import { NotificationModel } from "../models/Notification";
import { ProjectModel } from "../models/Project";
import { RevokedTokenModel } from "../models/RevokedToken";
import { TaskModel } from "../models/Task";
import { TeamModel } from "../models/Team";
import { UserModel } from "../models/User";

const ADMIN_EMAIL = "admin@crm.com";
const ADMIN_PASSWORD = "admin123";

async function seed(): Promise<void> {
  await connectDb();

  // 1. Clear database collections
  await ActivityModel.deleteMany({});
  await CommentModel.deleteMany({});
  await NotificationModel.deleteMany({});
  await ProjectModel.deleteMany({});
  await RevokedTokenModel.deleteMany({});
  await TaskModel.deleteMany({});
  await TeamModel.deleteMany({});
  await UserModel.deleteMany({});

  // 2. Create single Admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await UserModel.create({
    name: "Admin",
    email: ADMIN_EMAIL,
    role: "ADMIN",
    team: null,
    passwordHash,
  });

  console.log("\n========================================================");
  console.log(" Seed completed successfully!");
  console.log(" Created 1 Admin User:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     ${admin.role}`);
  console.log("========================================================\n");
}

seed()
  .catch((err: unknown) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
