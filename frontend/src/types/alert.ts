export interface AlertItem {
  _id: string;
  patientId: string;
  patientName: string;
  severity: "high" | "critical";
  vitals: any;
  alertTypes: string[];
  acknowledged: boolean;
  createdAt: string;
}