import { Schema, model, Types } from "mongoose";

export interface IPatientNote {
  patient: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const patientNoteSchema = new Schema<IPatientNote>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export const PatientNote = model<IPatientNote>("PatientNote", patientNoteSchema);