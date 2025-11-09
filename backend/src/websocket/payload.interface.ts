export type MessageType = "connect" | "disconnect" | "message" | "join";

export interface BasePayload {
  type: MessageType;
  isMachine: "true" | "false";
}

// 1. First-time connection from doctor/nurse
export interface StaffConnectPayload extends BasePayload {
  type: "connect";
  token: string; // doctor/nurse JWT token
  isMachine: "false";
}

// 2. First-time connection from machine
export interface MachineConnectPayload extends BasePayload {
  type: "connect";
  isMachine: "true";
}

// 3. Joining a specific patient room (doctor/nurse/machine)
export interface JoinRoomPayload extends BasePayload {
  type: "join";
  machineKey: string;
  patientId: string;
  isMachine: "true" | "false";
}

// 4. Doctor/nurse disconnect
export interface StaffDisconnectPayload extends BasePayload {
  type: "disconnect";
  machineKey: string;
  patientId: string;
  isMachine: "false";
}

// 5. Machine disconnect
export interface MachineDisconnectPayload extends BasePayload {
  type: "disconnect";
  isMachine: "true";
}

// 6. Vital data structure sent from machine
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

// 7. Real-time vital data message from machine
export interface MachineMessagePayload extends BasePayload {
  type: "message";
  machineKey: string;
  patientId: string;
  vitals: VitalData;
  isMachine: "true";
}

// 8. Union of all possible WebSocket payloads
export type WebSocketPayload =
  | StaffConnectPayload
  | MachineConnectPayload
  | JoinRoomPayload
  | StaffDisconnectPayload
  | MachineDisconnectPayload
  | MachineMessagePayload;
