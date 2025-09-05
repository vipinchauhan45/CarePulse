import {Schema, model, Types} from "mongoose";

interface IPatient{
    user: Types.ObjectId;
    age: number;
    gender: "male" | "female" | "other";
    assignedDoctors: Types.ObjectId[];
    assignedNurses: Types.ObjectId[];
    medicalHistory: string[];
}

const patientSchema = new Schema<IPatient>({
    user: {type: Schema.Types.ObjectId, ref: "User", required: true},
    age: {type: Number, required: true},
    gender: {type: String, enum: ["male", "female", "other"], required: true},
    assignedDoctors: [{type: Schema.Types.ObjectId, ref: "User"}],
    assignedNurses: [{type: Schema.Types.ObjectId, ref:"User"}],
    medicalHistory: [{type: String}]
},{timestamps: true});

export const Patient = model<IPatient>("Patient", patientSchema);