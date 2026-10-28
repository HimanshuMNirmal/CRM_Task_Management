import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { uploadDir } from "./middleware/upload";
import { apiRouter } from "./routes";

export const app = express();

app.use(cors(corsOptions));
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
