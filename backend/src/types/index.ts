import type { Role } from "../constants";

/** The logged-in user as the rest of the code sees it (attached to `req.user`). */
export interface AuthUser {
  id: string;
  role: Role;
  /** Team the user belongs to. Admins usually have none. */
  teamId: string | null;
}
