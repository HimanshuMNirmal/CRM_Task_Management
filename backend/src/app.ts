import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { uploadDir } from "./middleware/upload";
import { apiRouter } from "./routes";

export const app = express();

const allowedOrigins = env.CLIENT_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());

// Uploaded files. They are always downloaded (never rendered) so an uploaded .html can't run scripts.
app.use(
  "/uploads",
  express.static(uploadDir, {
    setHeaders: (res) => {
      res.setHeader("Content-Disposition", "attachment");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
