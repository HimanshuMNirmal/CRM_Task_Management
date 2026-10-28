import type { CorsOptions } from "cors";
import { env } from "./env";

const allowedOrigins = env.CLIENT_ORIGIN.split(",").map((o) => o.trim());

/** Shared by Express and Socket.IO so both accept the same origins. */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};
