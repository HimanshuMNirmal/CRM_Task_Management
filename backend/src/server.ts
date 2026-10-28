import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { startDueSoonJob } from "./jobs/dueSoon";

async function main(): Promise<void> {
  await connectDb();
  startDueSoonJob();
  app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
}

main().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
