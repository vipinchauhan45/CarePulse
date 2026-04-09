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
      index: true, //  quick lookup
    },

    patientName: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["high", "critical"],
      required: true,
      index: true,
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
      index: true,
    },

    acknowledged: {
      type: Boolean,
      default: false,
      index: true, //  for future "read/unread"
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


//  COMPOUND INDEX (BEST FOR YOUR MAIN QUERY)
// used in: getActiveAlerts + sorting
alertSchema.index({ patientId: 1, isActive: 1, createdAt: -1 });


//  PREVENT DUPLICATE ACTIVE ALERTS (SAFE VERSION)
// allows different alertTypes but prevents same severity spam
alertSchema.index(
  { patientId: 1, severity: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);


//  OPTIONAL (FOR FUTURE: unread notifications)
alertSchema.index({ acknowledged: 1, createdAt: -1 });


export const AlertModel = model<IAlert>("Alert", alertSchema);