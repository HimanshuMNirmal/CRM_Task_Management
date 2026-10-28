import { Schema, model } from "mongoose";

// JWTs cannot be "deleted", so on logout we remember the token id (jti) here.
// The `expires` index lets MongoDB remove the row automatically once the token would have expired anyway.
export interface IRevokedToken {
  jti: string;
  expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const RevokedTokenModel = model<IRevokedToken>("RevokedToken", revokedTokenSchema);
