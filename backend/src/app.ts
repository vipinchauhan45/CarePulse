import express from "express";
import type { Application, Request, Response } from "express";

const app: Application = express();

app.use(express.json());

export default app;
