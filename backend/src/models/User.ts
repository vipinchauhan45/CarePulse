import {Schema, model, Types} from "mongoose"

interface IUser{
    name: string;
    email: string;
    password: string;
    role: "admin" | "doctor" | "nurse",
    joinedRooms: Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    name: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String, unique: true, required: true},
    role: {type: String, enum: ["admin", "doctor", "nurse"], required: true},
    joinedRooms: [{type: Schema.Types.ObjectId, ref:"Room"}]
},{timestamps: true});

export const User = model<IUser>("User", userSchema);
