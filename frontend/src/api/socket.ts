// Socket.IO connection for live notifications. The server pushes events; we no longer poll.
import { io, type Socket } from "socket.io-client";
import { BASE_URL, tokenStorage } from "./client";

// Behind the Vercel `/socket.io/*` rewrite only plain HTTP gets through, so WebSocket upgrades fail.
// Set VITE_SOCKET_POLLING_ONLY=true there to use long-polling and skip the doomed upgrade attempt.
// Once the backend has its own HTTPS domain, point VITE_API_URL at it and drop the flag to get WebSockets.
const POLLING_ONLY = import.meta.env.VITE_SOCKET_POLLING_ONLY === "true";

export function connectSocket(): Socket {
  return io(BASE_URL || undefined, {
    // A function, so every reconnect sends the token that is saved right now.
    auth: (cb) => cb({ token: tokenStorage.get() }),
    transports: POLLING_ONLY ? ["polling"] : undefined,
  });
}
