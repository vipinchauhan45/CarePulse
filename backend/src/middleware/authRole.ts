import type { NextFunction, Request, Response } from "express";
import { User} from "../models/User.js";

function authenticateRole(...allowedRoles: string[]){
    return (req: Request, res: Response, next: NextFunction)=>{
        const user = req.user;
        console.log(user);
        if(!user) return res.status(401).json({ msg: "Unauthorized: No user info" });
        if(!allowedRoles.includes(user.role)) return res.status(403).json({ msg: "Access denied: Insufficient role" });
        next();
    }
}
export default authenticateRole;