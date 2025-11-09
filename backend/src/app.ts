import express from "express";
import type { Application, Request, Response } from "express";
import adminRoute from "./routes/adminRoutes.js";
import userRouter from "./routes/authRoutes.js";
import patientRoute from "./routes/patientRoutes.js";
import cors from "cors";
const app: Application = express();
app.use(cors());
app.use(express.json());

app.use("/admin", adminRoute);
app.use("/user", userRouter);
app.use("/patient", patientRoute);

export default app;
