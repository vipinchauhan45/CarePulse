import express from "express";
import type { Request, Response } from "express";
import authenticateToken from "../middleware/auth.js";
import {z} from "zod";
import { Types } from "mongoose";
import {Patient } from "../models/Patient.js";
import { DisPatient } from "../models/DischargetPatiend.js";
import { User } from "../models/User.js";

const patientRoute = express.Router();

const patientSchema = z.object({
  name: z.string().min(3, "username must be at least 3 characters long"),
  age: z.number().min(0, "age must be a positive number"),
  gender: z.enum(["male", "female", "other"]),
  assignedDoctors: z.array(z.string()).optional(),
  assignedNurses: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  machineKey: z.string().min(3, "machineKey is required"),
});

const updatePatientSchema = patientSchema.partial();
const idParamSchema = z.object({
  id: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid patient ID",
  }),
});

patientRoute.post("/addPatient", authenticateToken, async (req: Request, res: Response) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ msg: "Validation failed", errors: parsed.error.issues });

  try {
    const patientData: any = {
      ...parsed.data,
      createdBy: req.user?._id,
    };

    if (req.user?.role === "doctor" || req.user?.role === "admin") {
      patientData.assignedDoctors = [
        ...(parsed.data.assignedDoctors || []),
        req.user._id,
      ];
    } else if (req.user?.role === "nurse") {
      patientData.assignedNurses = [
        ...(parsed.data.assignedNurses || []),
        req.user._id,
      ];
    }

    const patient = await Patient.create(patientData);

    const populated = await Patient.findById(patient._id)
      .populate("createdBy", "name email role")
      .populate("assignedDoctors", "name email role")
      .populate("assignedNurses", "name email role")
      .populate("previouslyAssignedDoctors", "name email role")
      .populate("previouslyAssignedNurses", "name email role");

    res.status(201).json({ msg: "Patient created successfully", patient: populated });
  } catch (e: any) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});


const assignDoctorsSchema = z.object({
  doctors: z.array(z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid doctor ID"
  }))
});

const assignNursesSchema = z.object({
  nurses: z.array(z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid nurse ID"
  }))
});

patientRoute.get("/allPatient", authenticateToken, async (req: Request, res: Response)=>{
    try{
        if(!req.user) return res.status(401).json({ msg: "Unauthorized" });
        const patient = await Patient.find({
            $or:[
                {assignedDoctors: req.user._id},
                {assignedNurses: req.user._id}
            ]
        })
        .populate("assignedDoctors", "name email role")
        .populate("assignedNurses", "name, email role")
        .populate("previouslyAssignedDoctors", "name email role")
        .populate("previouslyAssignedNurses", "name email role");

        res.status(200).json({patient});
    }
    catch(e: any){
        res.status(500).json({ msg: "Server error", error: e.message });
    }
})

patientRoute.get("/getPatient/:id", authenticateToken, async(req: Request, res: Response)=>{
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
    return res.status(400).json({ msg: "Invalid ID", errors: parsed.error.issues });
    }
    
    const {id} = parsed.data;

    try{
        const patient = await Patient.findById(id)
        .populate("assignedDoctors", "name email role")
        .populate("assignedNurses", "name, email role")
        .populate("previouslyAssignedDoctors", "name email role")
        .populate("previouslyAssignedNurses", "name email role");

        if (!patient) return res.status(404).json({ msg: "Patient not found" });

    //     const isAssigned =
    //   patient.assignedDoctors.some((doc: any) => doc._id.toString() === req.user?._id) ||
    //   patient.assignedNurses.some((nurse: any) => nurse._id.toString() === req.user?._id);

    // if (!isAssigned) return res.status(403).json({ msg: "Access denied" });
    //     res.status(200).json(patient);
    }
    catch (e: any) {
    res.status(500).json({ msg: "Server error", error: e.message });
    }
})

patientRoute.put("/updatePatient/:id", authenticateToken, async(req: Request, res: Response)=>{
    const idParsed = idParamSchema.safeParse(req.params);
    if(!idParsed.success) return res.status(400).json({ msg: "Invalid ID", errors: idParsed.error.issues });
    
    const bodyParsed = updatePatientSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ msg: "Validation failed", errors: bodyParsed.error.issues });
    }

    const {id} = idParsed.data;

    try{
        const patient = await Patient.findById(id);
        if(!patient) return res.status(404).json({ msg: "Patient not found" });

        const updated = await Patient.findByIdAndUpdate(id, bodyParsed.data, {new: true})
        .populate("assignedDoctors", "name email role")
        .populate("assignedNurses", "name email role")
        .populate("previouslyAssignedDoctors", "name email role")
        .populate("previouslyAssignedNurses", "name email role");
        res.status(200).json({ msg: "Patient updated successfully", patient: updated });
    }
    catch(e: any){
        res.status(500).json({ msg: "Server error", error: e.message });
    }
})

patientRoute.delete("/deletePatient/:id", authenticateToken, async(req: Request, res: Response)=>{
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ msg: "Invalid ID", errors: parsed.error.issues });
    }
    const { id } = parsed.data;

    try{
        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ msg: "Patient not found" });
        await Patient.findByIdAndDelete(id);

        await DisPatient.create(patient);
        res.status(200).json({ msg: "Patient deleted successfully" });
    }
    catch(e: any){
        res.status(500).json({ msg: "Server error", error: e.message });
    }
})

patientRoute.get("/allDoctor/:id", authenticateToken, async (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ msg: "Invalid ID", errors: parsed.error.issues });
  }

  const { id } = parsed.data;

  try {
    const patient = await Patient.findById(id).populate("assignedDoctors", "_id");
    if (!patient) return res.status(404).json({ msg: "Patient not found" });

    // collect assigned doctor IDs
    const assignedDoctorIds = patient.assignedDoctors.map((doc: any) => doc._id);

    // fetch doctors not in assignedDoctorIds
    const doctors = await User.find({
      role: "doctor",
      _id: { $nin: assignedDoctorIds },
    }).select("name email role");

    res.status(200).json({ doctors });
  } catch (e: any) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});

patientRoute.get("/allNurse/:id", authenticateToken, async (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ msg: "Invalid ID", errors: parsed.error.issues });
  }

  const { id } = parsed.data;

  try {
    const patient = await Patient.findById(id).populate("assignedNurses", "_id");
    if (!patient) return res.status(404).json({ msg: "Patient not found" });

    // collect assigned nurse IDs
    const assignedNurseIds = patient.assignedNurses.map((nurse: any) => nurse._id);

    // fetch nurses not in assignedNurseIds
    const nurses = await User.find({
      role: "nurse",
      _id: { $nin: assignedNurseIds },
    }).select("name email role");

    res.status(200).json({ nurses });
  } catch (e: any) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});

patientRoute.post("/assignDoctors/:id", authenticateToken, async (req: Request, res: Response) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ msg: "Invalid patient ID", errors: idParsed.error.issues });
  }

  const bodyParsed = assignDoctorsSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ msg: "Validation failed", errors: bodyParsed.error.issues });
  }

  const { id } = idParsed.data;
  const { doctors } = bodyParsed.data;

  try {
    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ msg: "Patient not found" });

    // Convert to ObjectId and avoid duplicates
    const uniqueDoctors = doctors
      .map(docId => new Types.ObjectId(docId))
      .filter(objId => !patient.assignedDoctors.some((assigned: any) => assigned.equals(objId)));

    patient.assignedDoctors.push(...uniqueDoctors);
    await patient.save();

    const updated = await Patient.findById(id)
      .populate("assignedDoctors", "name email role")
      .populate("assignedNurses", "name email role")
      .populate("previouslyAssignedDoctors", "name email role")
      .populate("previouslyAssignedNurses", "name email role");

    res.status(200).json({ msg: "Doctors assigned successfully", patient: updated });
  } catch (e: any) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});

// Assign nurses to patient
patientRoute.post("/assignNurses/:id", authenticateToken, async (req: Request, res: Response) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ msg: "Invalid patient ID", errors: idParsed.error.issues });
  }

  const bodyParsed = assignNursesSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ msg: "Validation failed", errors: bodyParsed.error.issues });
  }

  const { id } = idParsed.data;
  const { nurses } = bodyParsed.data;

  try {
    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ msg: "Patient not found" });

    // Convert to ObjectId and avoid duplicates
    const uniqueNurses = nurses
      .map(nurseId => new Types.ObjectId(nurseId))
      .filter(objId => !patient.assignedNurses.some((assigned: any) => assigned.equals(objId)));

    patient.assignedNurses.push(...uniqueNurses);
    await patient.save();

    const updated = await Patient.findById(id)
      .populate("assignedDoctors", "name email role")
      .populate("assignedNurses", "name email role")
      .populate("previouslyAssignedDoctors", "name email role")
      .populate("previouslyAssignedNurses", "name email role");

    res.status(200).json({ msg: "Nurses assigned successfully", patient: updated });
  } catch (e: any) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});

export default patientRoute;