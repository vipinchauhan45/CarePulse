import { Schema, model, Types, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  createdAt: Date;
  members: Types.ObjectId[]; // references to User
}

const roomSchema = new Schema<IRoom>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export const Room = model<IRoom>("Room", roomSchema);
