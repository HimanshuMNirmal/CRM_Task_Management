// Socket.IO server: pushes notifications to logged-in users instead of the browser polling for them.
// Every socket joins a private room named after its user, so we can emit to "user:<id>" from anywhere.
//
// In production the browser reaches us through the Vercel `/socket.io/*` rewrite. That proxy only
// speaks plain HTTP, so the client uses Socket.IO's long-polling transport there (see frontend/src/api/socket.ts).
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOptions } from "../config/cors";
import { verifyToken } from "../services/auth.service";
import type { AuthUser } from "../types";

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, { cors: corsOptions });

  // Same check as the REST `authenticate` middleware: valid, non-revoked JWT of an active user.
  io.use(async (socket, next) => {
    const token: unknown = socket.handshake.auth.token;
    if (typeof token !== "string" || token === "") return next(new Error("Unauthorized"));
    try {
      const { user } = await verifyToken(token);
      socket.data.user = user satisfies AuthUser;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    void socket.join(userRoom((socket.data.user as AuthUser).id));
  });

  return io;
}

/** Sends an event to every open tab of each user. Does nothing if the socket server isn't running (tests, seed). */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}
