import SendmailTransport from "nodemailer/lib/sendmail-transport/index.js";
import type { VitalData } from "./payload.interface.js";
import { Patient } from "../models/Patient.js";
import { sendAlertEmail } from "./sendAlertEmail.js";

export const triggerAlertIfAbnormal = async (patientId: string, vitals: VitalData) => {
  const abnormal =
    vitals.heartRate < 60 || vitals.heartRate > 120 ||
    vitals.oxygenSaturation < 90 ||
    vitals.temperature > 39 ||
    vitals.meanArterialPressure < 65;

  if (!abnormal) return;

  const patient = await Patient.findById(patientId)
    .populate("assignedDoctors assignedNurses", "email name")
    .exec();

  if (!patient) return;

  const message = `
🚨 ALERT: Abnormal Vital Signs Detected for ${patient.name}

Heart Rate: ${vitals.heartRate}
Respiratory Rate: ${vitals.respiratoryRate}
Blood Pressure: ${vitals.bloodPressure}
Mean Arterial Pressure: ${vitals.meanArterialPressure}
Oxygen Saturation: ${vitals.oxygenSaturation}
Temperature: ${vitals.temperature}
ECG: ${vitals.ecgWaveform}
End Tidal CO₂: ${vitals.endTidalCO2}
FiO₂: ${vitals.fiO2}
Tidal Volume: ${vitals.tidalVolume}
Central Venous Pressure: ${vitals.centralVenousPressure}
`;

  // Send alert email to all assigned doctors and nurses
  const recipients = [
    ...patient.assignedDoctors.map((d: any) => d.email),
    ...patient.assignedNurses.map((n: any) => n.email),
  ];

  for (const email of recipients) {
    await sendAlertEmail(email, ` Abnormal Vitals for ${patient.name}`, message);
  }

  console.log(` Alert sent to assigned staff of ${patient.name}`);
};
