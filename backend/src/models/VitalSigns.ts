import { Schema, model, Document, Types } from "mongoose";

export interface IVitalSigns extends Document {
  patient: Types.ObjectId;
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: string;              
  meanArterialPressure: number;        
  oxygenSaturation: number;            
  temperature: number;                   
  ecgWaveform: string;                  
  endTidalCO2: number;                  
  fiO2: number;                         
  tidalVolume: number;                  
  centralVenousPressure: number;        
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
