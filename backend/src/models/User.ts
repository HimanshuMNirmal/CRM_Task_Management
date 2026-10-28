import { Schema, model, type Types } from "mongoose";
import { ROLES, type Role } from "../constants";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  /** The team this user belongs to (managers and employees). Changed only via the Teams API. */
  team: Types.ObjectId | null;
  isActive: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // `select: false` means the hash is never returned unless we ask for it explicitly.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>("User", userSchema);
