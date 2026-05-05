// User & Auth Types
export type UserRole = 'admin' | 'doctor' | 'nurse';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  joinedRooms?: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  msg: string;
  token: string;
  userData?: User;
}

// Patient Types
export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  machineKey: string;
  medicalHistory?: string[];
  assignedDoctors: User[];
  assignedNurses: User[];
  createdAt?: string;
}

// History Response Types
export interface VitalsHistoryResponse {
  total: number;
  page: number;
  limit: number;
  data: VitalRecord[];
}

export interface AddPatientRequest {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalHistory?: string[];
  machineKey: string;
}

// Vitals Types
export interface Vitals {
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: string;
  meanArterialPressure: number;
  oxygenSaturation: number;
  temperature: number;
  ecgWaveform?: string;
  endTidalCO2: number;
  fiO2: number;
  tidalVolume: number;
  centralVenousPressure: number;
  recordedAt?: string;
}

export interface VitalRecord extends Vitals {
  _id: string;
  patient: string;
  recordedAt: string;
}

export interface VitalDataPoint {
  timestamp: number;
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  meanArterialPressure?: number;
  respiratoryRate?: number;

  endTidalCO2?: number;
  fiO2Pct?: number;        // store FiO2 as %
  tidalVolume?: number;
  centralVenousPressure?: number;

  systolic?: number;       // from bloodPressure "120/80"
  diastolic?: number;
  ecgValue?: number;
}


// Notes Types
export interface Note {
  _id: string;
  text: string;
  author: User;
  createdAt: string;
}

// WebSocket Message Types
export interface WSConnectMessage {
  type: 'connect';
  token: string;
  isMachine: string;
}

export interface WSJoinMessage {
  type: 'join';
  machineKey: string;
  patientId: string;
  isMachine: string;
}

export interface WSVitalUpdateMessage {
  type: 'vitalUpdate';
  vitals: Vitals;
}

export type WSMessage = WSConnectMessage | WSJoinMessage | WSVitalUpdateMessage;
