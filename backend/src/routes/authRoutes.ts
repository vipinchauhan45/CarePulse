import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/auth.js";
import signupSchema from "../schema/signup.js";
const userRouter = express.Router();

type UserInput = z.infer<typeof signupSchema>;

type loginData = Pick<UserInput, "email" | "password">;

userRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password }: loginData = req.body;
  try {
    const userData = await User.findOne({ email });
    
    if (!userData) {
      return res.status(400).json({
        msg: "invalid user",
      });
    }
    const passwordMatch = await bcrypt.compare(password, userData.password);
    console.log(userData);
    if (!passwordMatch) {
      return res.status(400).json({
        msg: "password is not correct",
      });
    }

    const token = jwt.sign(
      { email: userData.email, _id: userData._id, role: userData.role },
      process.env.JWT_SECRET as string
    );

    return res.status(200).json({
      msg: "signin successfully",
      token: token,
      userData
    });
  } catch (e: any) {
    return res.status(500).json({
      msg: "Server error",
      error: e.message,
    });
  }
});

userRouter.get("/profile", authenticateToken, async (req: Request, res: Response)=>{
    try{
        const user = await User.findById(req.user?._id).select("-password");
        if(!user) return res.status(404).json({error: "user not found"});

        res.status(200).json({user});
    } catch(e: any){
        res.status(500).json({
          error: e.message
        });
    }
})

export default userRouter;
