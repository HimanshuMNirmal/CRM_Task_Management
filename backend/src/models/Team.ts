import { Schema, model } from "mongoose";

// A team is just a name. Who belongs to it is stored on each user (`user.team`),
// so there is only one place to look and nothing can get out of sync.
export interface ITeam {
  name: string;
}

const teamSchema = new Schema<ITeam>(
  { name: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true },
);

export const TeamModel = model<ITeam>("Team", teamSchema);
