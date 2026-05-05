import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AlertItem } from "@/types/alert";
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  Patient,
  AddPatientRequest,
  VitalsHistoryResponse,
  Note 
} from '@/types';

const API_BASE_URL = 'http://localhost:8090';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_role');
      localStorage.removeItem('last_patient_id');
      localStorage.removeItem('last_machine_key');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/user/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/user/register', data);
    return response.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/user/profile');
    return response.data;
  },
};

// ============ Admin API ============
export const adminApi = {
  addStaff: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/admin/addStaff', data);
    return response.data;
  },

  getAllStaff: async (): Promise<{ users: User[] }> => {
    const response = await api.get<{ users: User[] }>('/admin/allStaff');
    return response.data;
  },

  getStaffById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/admin/${id}`);
    return response.data;
  },

  deleteStaff: async (id: string): Promise<{ msg: string }> => {
    const response = await api.delete<{ msg: string }>(`/admin/${id}`);
    return response.data;
  },
};

// ============ Patient API ============
export const patientApi = {
  getAllPatients: async (): Promise<{ patient: Patient[] }> => {
    const response = await api.get<{ patient: Patient[] }>('/patient/allPatient');
    return response.data;
  },

  getPatientById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/patient/getPatient/${id}`);
    return response.data;
  },

  addPatient: async (data: AddPatientRequest): Promise<{ msg: string; patient: Patient }> => {
    const response = await api.post<{ msg: string; patient: Patient }>('/patient/addPatient', data);
    return response.data;
  },

  // Get available doctors (not assigned to patient)
  getAvailableDoctors: async (patientId: string): Promise<{ doctors: User[] }> => {
    const response = await api.get<{ doctors: User[] }>(`/patient/allDoctor/${patientId}`);
    return response.data;
  },

  // Get available nurses (not assigned to patient)
  getAvailableNurses: async (patientId: string): Promise<{ nurses: User[] }> => {
    const response = await api.get<{ nurses: User[] }>(`/patient/allNurse/${patientId}`);
    return response.data;
  },

  // Assign doctors to patient
  assignDoctors: async (patientId: string, doctorIds: string[]): Promise<{ msg: string; patient: Patient }> => {
    const response = await api.post<{ msg: string; patient: Patient }>(`/patient/assignDoctors/${patientId}`, { doctors: doctorIds });
    return response.data;
  },

  // Assign nurses to patient
  assignNurses: async (patientId: string, nurseIds: string[]): Promise<{ msg: string; patient: Patient }> => {
    const response = await api.post<{ msg: string; patient: Patient }>(`/patient/assignNurses/${patientId}`, { nurses: nurseIds });
    return response.data;
  },

  // Discharge patient (delete)
  dischargePatient: async (patientId: string): Promise<{ msg: string }> => {
    const response = await api.delete<{ msg: string }>(`/patient/deletePatient/${patientId}`);
    return response.data;
  },

  // Get medical history
  getMedicalHistory: async (patientId: string): Promise<{ medicalHistory: string[] }> => {
    const response = await api.get<{ medicalHistory: string[] }>(`/patient/${patientId}/getMedicalHistory`);
    return response.data;
  },

  // Add medical history entry
  addMedicalHistory: async (patientId: string, entry: string): Promise<{ msg: string; medicalHistory: string[] }> => {
    const response = await api.post<{ msg: string; medicalHistory: string[] }>(`/patient/${patientId}/medicalHistory`, { entry });
    return response.data;
  },
};

// ============ Vitals API ============
export const vitalsApi = {
  getHistory: async (patientId: string, limit = 500, page = 1): Promise<VitalsHistoryResponse> => {
    const response = await api.get<VitalsHistoryResponse>(`/vitals/history/${patientId}?limit=${limit}&page=${page}`);
    return response.data;
  },
};

// ============ Notes API ============
export const notesApi = {
  getNotes: async (patientId: string): Promise<{ notes: Note[] }> => {
    const response = await api.get<{ notes: Note[] }>(`/patient/${patientId}/notes`);
    return response.data;
  },

  addNote: async (patientId: string, text: string): Promise<{ note: Note }> => {
    const response = await api.post<{ note: Note }>(`/patient/${patientId}/notes`, { text });
    return response.data;
  },

  deleteNote: async (patientId: string, noteId: string): Promise<{ msg: string }> => {
    const response = await api.delete<{ msg: string }>(`/patient/${patientId}/notes/${noteId}`);
    return response.data;
  },
};

// ============ Alert API ============
export const alertApi = {
  getActiveAlerts: async (): Promise<{ data: AlertItem[] }> => {
    const response = await api.get<{ data: AlertItem[] }>("/alert/active");
    return response.data;
  },

  // ADD THIS
  acknowledgeAlert: async (alertId: string): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(
      `/alert/${alertId}/acknowledge`
    );
    return response.data;
  },
};

export default api;
