// Socket.IO auth and per-user delivery. Uses the long-polling transport, like production behind the Vercel proxy.
import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { emitToUser, initSocket } from "../src/realtime/socket";

vi.hoisted(() => {
  process.env.MONGODB_URI ??= "mongodb://unused";
  process.env.JWT_SECRET ??= "test-secret-at-least-16-chars";
});

// vi.hoisted/vi.mock run before the imports above, so env.ts and the socket module see these.
// Tokens are just user ids here; anything else is rejected like an invalid JWT.
vi.mock("../src/services/auth.service", () => ({
  verifyToken: async (token: string) => {
    if (!token.startsWith("user")) throw new Error("bad token");
    return { user: { id: token, role: "EMPLOYEE", teamId: null }, token: { jti: "j", exp: 0 } };
  },
}));

let httpServer: HttpServer;
let url: string;
const clients: Socket[] = [];

function client(token: string): Socket {
  const socket = connect(url, { auth: { token }, transports: ["polling"], reconnection: false });
  clients.push(socket);
  return socket;
}

beforeAll(async () => {
  httpServer = createServer();
  initSocket(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(() => {
  clients.forEach((c) => c.disconnect());
  httpServer.close();
});

describe("socket auth", () => {
  it("rejects a connection without a valid token", async () => {
    const error = await new Promise<Error>((resolve) => client("garbage").on("connect_error", resolve));
    expect(error.message).toBe("Unauthorized");
  });
});

describe("emitToUser", () => {
  it("delivers only to the target user", async () => {
    const alice = client("user-alice");
    const bob = client("user-bob");
    await Promise.all([alice, bob].map((s) => new Promise<void>((resolve) => s.on("connect", resolve))));

    const bobGot = vi.fn();
    bob.on("notification:new", bobGot);
    const received = new Promise((resolve) => alice.on("notification:new", resolve));

    // Joining the room happens right after "connect" on the server; give it a tick.
    await new Promise((resolve) => setTimeout(resolve, 50));
    emitToUser("user-alice", "notification:new", { message: "hi" });

    expect(await received).toEqual({ message: "hi" });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(bobGot).not.toHaveBeenCalled();
  });
});
