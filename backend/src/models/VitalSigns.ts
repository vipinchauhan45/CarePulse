import { Schema, model, Document, Types } from "mongoose";

export interface IVitalSigns extends Document {
  patient: Types.ObjectId;
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: string;                // e.g., "120/80"
  meanArterialPressure: number;         // MAP
  oxygenSaturation: number;             // SpO2
  temperature: number;                  // °C
  ecgWaveform: string;                  // could be base64, file path, or raw data
  endTidalCO2: number;                  // EtCO2
  fiO2: number;                         // Fraction of inspired oxygen
  tidalVolume: number;                  // mL
  centralVenousPressure: number;        // CVP
  recordedAt: Date;
}

const vitalSignsSchema = new Schema<IVitalSigns>({
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  heartRate: Number,
  respiratoryRate: Number,
  bloodPressure: String,
  meanArterialPressure: Number,
  oxygenSaturation: Number,
  temperature: Number,
  ecgWaveform: String,                  
  endTidalCO2: Number,
  fiO2: Number,
  tidalVolume: Number,
  centralVenousPressure: Number,
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const VitalSigns = model<IVitalSigns>("VitalSigns", vitalSignsSchema);
