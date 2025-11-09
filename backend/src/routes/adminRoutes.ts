import express from "express";
import type { Request, Response } from "express";
import authenticateToken from "../middleware/auth.js";
import { User } from "../models/User.js";
import {z} from "zod";
import authenticateRole from "../middleware/authRole.js";
import signupSchema from "../schema/signup.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminRoute = express.Router();
type UserInput = z.infer<typeof signupSchema>;

adminRoute.post("/addStaff", authenticateToken, authenticateRole("admin"), async(req: Request, res: Response)=>{
  const { success } = signupSchema.safeParse(req.body);
  const userInfo = req.body;
  if (!success) {
    return res.status(400).json({
      msg: "validation failed",
    });
  }

  try {
    const existingUser = await User.findOne({ email: userInfo.email });
    if (existingUser) {
      return res.status(400).json({
        msg: "userAlready exists",
      });
    }

    const hashPassword: string = await  bcrypt.hash(
      userInfo.password,
      Number(process.env.NUM)
    );

    const user = await User.create({
      name: userInfo.name,
      password: hashPassword,
      email: userInfo.email,
      role: userInfo.role,
    });

    const token = jwt.sign(
      { email: user.email, _id: user._id, role: user.role },
      process.env.JWT_SECRET as string
    );

    return res.status(201).json({
      msg: "user created successfully",
      token: token,
    });
  } catch (e: any) {
    return res.status(500).json({
      msg: "server error",
      error: e.message,
    });
  }
})

adminRoute.get("/allStaff", authenticateToken, authenticateRole("admin"), async(req: Request, res: Response)=>{
    try{
        const users = await User.find().select("-password");
        res.status(200).json({users});
    }catch(e: any){
        res.status(500).json({ msg: "Server error", error: e.message });
    }
})

adminRoute.get("/:id", authenticateToken, authenticateRole("admin"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});


adminRoute.delete("/:id", authenticateToken, authenticateRole("admin"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedUser = await User.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).json({ msg: "User not found" }); 
      }

      return res.status(200).json({ msg: "User deleted successfully" });
    } catch (err: any) {
      return res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

export default adminRoute;