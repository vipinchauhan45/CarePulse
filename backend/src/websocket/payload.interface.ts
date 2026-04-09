export type MessageType =
  | "connect"
  | "join"
  | "leave"
  | "message";

export interface BasePayload {
  type: MessageType;
  isMachine: "true" | "false";
}

export interface VitalData {
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
}

export interface StaffConnectPayload extends BasePayload {
  type: "connect";
  isMachine: "false";
  token: string;
}

export interface MachineConnectPayload extends BasePayload {
  type: "connect";
  isMachine: "true";
}

export interface JoinRoomPayload extends BasePayload {
  type: "join";
  machineKey: string;
  patientId: string;
}

export interface LeaveRoomPayload extends BasePayload {
  type: "leave";
  machineKey: string;
  patientId: string;
}

export interface MachineMessagePayload extends BasePayload {
  type: "message";
  isMachine: "true";
  machineKey: string;
  patientId: string;
  vitals: VitalData;
}

export type WebSocketPayload =
  | StaffConnectPayload
  | MachineConnectPayload
  | JoinRoomPayload
  | LeaveRoomPayload
  | MachineMessagePayload;

export type AlertSeverity = "high" | "critical";

export interface AlertPayload {
  type: "alert";

  alertId: string;

  severity: "high" | "critical";
  patientId: string;
  patientName: string;
  vitals: VitalData;
  createdAt: string;
  alertTypes: string[];

  acknowledged: boolean;
}

export interface RecoveryPayload {
  type: "recovery";
  patientId: string;
  patientName: string;
  createdAt: string;
}
