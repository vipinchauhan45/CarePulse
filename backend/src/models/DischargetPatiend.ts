import { Schema, model, Types, Document } from "mongoose";

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  assignedDoctors: Types.ObjectId[];
  assignedNurses: Types.ObjectId[];
  previouslyAssignedDoctors: Types.ObjectId[];
  previouslyAssignedNurses: Types.ObjectId[];
  medicalHistory: string[];
  createdBy: Types.ObjectId; 
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    assignedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedNurses: [{ type: Schema.Types.ObjectId, ref: "User" }],
    previouslyAssignedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    previouslyAssignedNurses: [{ type: Schema.Types.ObjectId, ref: "User" }],
    medicalHistory: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const DisPatient = model<IPatient>("DisPatient", patientSchema);
