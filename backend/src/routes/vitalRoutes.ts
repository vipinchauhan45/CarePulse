import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import authenticateToken from "../middleware/auth.js";
import { Patient } from "../models/Patient.js";
import { VitalSigns } from "../models/VitalSigns.js";

const vitalsRoute = express.Router();

const paramsSchema = z.object({
  patientId: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid patientId",
  }),
});

const querySchema = z.object({
  from: z.string().optional(), // ISO date
  to: z.string().optional(),   // ISO date
  limit: z.string().optional(),
  page: z.string().optional(),
});

vitalsRoute.get(
  "/history/:patientId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const paramsParsed = paramsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({ msg: "Invalid patientId", errors: paramsParsed.error.issues });
    }

    const queryParsed = querySchema.safeParse(req.query);
    if (!queryParsed.success) {
      return res.status(400).json({ msg: "Invalid query params", errors: queryParsed.error.issues });
    }

    const { patientId } = paramsParsed.data;
    const { from, to, limit, page } = queryParsed.data;

    try {
      const patient = await Patient.findById(patientId)
        .select("assignedDoctors assignedNurses")
        .lean();

      if (!patient) return res.status(404).json({ msg: "Patient not found" });

      const role = req.user?.role;
      const userId = req.user?._id;

      const isAdmin = role === "admin";
      const isDoctorAssigned =
        role === "doctor" &&
        patient.assignedDoctors?.some((id: any) => id.toString() === userId);

      const isNurseAssigned =
        role === "nurse" &&
        patient.assignedNurses?.some((id: any) => id.toString() === userId);

      if (!isAdmin && !isDoctorAssigned && !isNurseAssigned) {
        return res.status(403).json({ msg: "Not authorized for this patient" });
      }

      const filter: any = { patient: new Types.ObjectId(patientId) };

      if (from || to) {
        const recordedAt: any = {};
        if (from) recordedAt.$gte = new Date(from);
        if (to) recordedAt.$lte = new Date(to);
        filter.recordedAt = recordedAt;
      }

      const lim = Math.min(Math.max(parseInt(limit || "500", 10), 1), 2000);
      const pg = Math.max(parseInt(page || "1", 10), 1);
      const skip = (pg - 1) * lim;

      const total = await VitalSigns.countDocuments(filter);

      const data = await VitalSigns.find(filter)
        .sort({ recordedAt: 1 })
        .skip(skip)
        .limit(lim)
        .select("-__v")
        .lean();

      return res.status(200).json({
        total,
        page: pg,
        limit: lim,
        data,
      });
    } catch (e: any) {
      return res.status(500).json({ msg: "Server error", error: e.message });
    }
  }
);

export default vitalsRoute;