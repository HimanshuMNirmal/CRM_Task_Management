import { NotificationModel } from "../models/Notification";
import { TaskModel } from "../models/Task";

const HOUR = 60 * 60 * 1000;

/**
 * Finds tasks due within the next 24 hours and notifies the assignee - once per task.
 * `dueSoonNotified` is the "already told them" flag.
 */
export async function notifyDueSoonTasks(): Promise<number> {
  const now = new Date();
  const tasks = await TaskModel.find({
    status: { $ne: "DONE" },
    dueSoonNotified: false,
    dueDate: { $gte: now, $lte: new Date(now.getTime() + 24 * HOUR) },
  }).select("title assignee");

  if (tasks.length === 0) return 0;

  await NotificationModel.insertMany(
    tasks.map((task) => ({
      user: task.assignee,
      task: task._id,
      type: "DUE_SOON",
      message: `"${task.title}" is due within 24 hours`,
    })),
  );
  await TaskModel.updateMany({ _id: { $in: tasks.map((t) => t._id) } }, { dueSoonNotified: true });
  return tasks.length;
}

/** Runs the check now and then every 10 minutes while the server is up. */
export function startDueSoonJob(): void {
  const run = () => notifyDueSoonTasks().catch((err: unknown) => console.error("Due-soon job failed:", err));
  void run();
  setInterval(run, 10 * 60 * 1000).unref();
}
