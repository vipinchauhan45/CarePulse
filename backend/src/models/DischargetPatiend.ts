import { Schema, model, Types, Document } from "mongoose";

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  weight: number;
  height: number;
  assignedDoctors: Types.ObjectId[];
  assignedNurses: Types.ObjectId[];
  previouslyAssignedDoctors: Types.ObjectId[];
  previouslyAssignedNurses: Types.ObjectId[];
  medicalHistory: string[];
  createdBy: Types.ObjectId;
  machineKey: string;
  deletedAt: Date;
  originalPatientId?: Types.ObjectId;
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    weight: { type: Number, required: true, min: 1, max: 500 },
    height: { type: Number, required: true, min: 0.2, max: 3.8 },
    assignedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedNurses: [{ type: Schema.Types.ObjectId, ref: "User" }],
    previouslyAssignedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    previouslyAssignedNurses: [{ type: Schema.Types.ObjectId, ref: "User" }],
    medicalHistory: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    machineKey: { type: String, required: true,},
    deletedAt: { type: Date, default: Date.now,},
    originalPatientId: { type: Schema.Types.ObjectId, ref: "Patient",
},
  },
  { timestamps: true },
);

export const DisPatient = model<IPatient>("DisPatient", patientSchema);
