import {Schema, model} from "mongoose"

interface IUser{
    name: string;
    email: string;
    password: string;
    role: "admin" | "doctor" | "nurse" | "patient"
}

const userSchema = new Schema<IUser>({
    name: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String, unique: true, required: true},
    role: {type: String, enum: ["admin", "doctor", "nurse", "patient"], required: true}
},{timestamps: true});

export const User = model<IUser>("User", userSchema);
