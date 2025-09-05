import { Schema, model, Document, Types } from "mongoose";

export interface IAlert extends Document {
  patient: Types.ObjectId;
  generatedBy: Types.ObjectId; // system/doctor/nurse
  message: string;
  severity: "low" | "medium" | "high";
  acknowledged: boolean;
}

const alertSchema = new Schema<IAlert>({
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
  acknowledged: { type: Boolean, default: false }
}, { timestamps: true });

export const Alert = model<IAlert>("Alert", alertSchema);
