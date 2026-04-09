import type { Request, Response } from "express";
import { AlertModel } from "../models/Alert.js";
import { Patient } from "../models/Patient.js";

export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    //  find assigned patients
    const patients = await Patient.find({
      $or: [
        { assignedDoctors: userId },
        { assignedNurses: userId },
      ],
    }).select("_id name");

    const patientIds = patients.map((p) => p._id);

    //  fetch active alerts
    const alerts = await AlertModel.find({
      patientId: { $in: patientIds },
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    console.error("[GET ACTIVE ALERTS ERROR]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await AlertModel.findByIdAndUpdate(id, {
      acknowledged: true,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[ACK ALERT ERROR]", err);
    res.status(500).json({ success: false });
  }
};