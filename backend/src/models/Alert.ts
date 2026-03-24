import { Schema, model, Document, Types } from "mongoose";

export interface IAlert extends Document {
  patientId: Types.ObjectId;
  patientName: string;

  severity: "high" | "critical";
  alertTypes: string[];

  vitals: {
    heartRate: number;
    respiratoryRate: number;
    bloodPressure: string;
    meanArterialPressure: number;
    oxygenSaturation: number;
    temperature: number;
    ecgWaveform?: string;
    endTidalCO2?: number;
    fiO2?: number;
    tidalVolume?: number;
    centralVenousPressure?: number;
  };

  isActive: boolean;
  acknowledged: boolean;

  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["high", "critical"],
      required: true,
    },

    alertTypes: [
      {
        type: String,
        required: true,
      },
    ],

    vitals: {
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
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ✅ for future (doctor acknowledges alert)
    acknowledged: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);


// ✅ INDEX 1: fast lookup for active alerts
alertSchema.index({ patientId: 1, isActive: 1 });

// ✅ INDEX 2: prevent duplicate active alerts (same severity)
alertSchema.index(
  { patientId: 1, severity: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

export const AlertModel = model<IAlert>("Alert", alertSchema);