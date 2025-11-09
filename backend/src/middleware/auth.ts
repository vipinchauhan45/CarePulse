import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

interface MyJwtPayload extends JwtPayload {
  _id: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: MyJwtPayload;
  }
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as MyJwtPayload;

    req.user = decoded;
    console.log(decoded);
    next();
  } catch (e) {
    return res.status(400).json({
      message: "Invalid or expired token.",
    });
  }
};

export default authenticateToken;
