import { createServer } from "node:http";
import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { startDueSoonJob } from "./jobs/dueSoon";
import { initSocket } from "./realtime/socket";

async function main(): Promise<void> {
  await connectDb();
  // One HTTP server for both Express and Socket.IO, so they share port 5000.
  const server = createServer(app);
  initSocket(server);
  startDueSoonJob();
  server.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
}

main().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
