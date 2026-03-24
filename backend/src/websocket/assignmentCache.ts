import { Patient } from "../models/Patient.js";

export interface AssignedStaff {
  staffIds: string[];
  emails: string[];
  patientName: string;
}

type CacheEntry = { value: AssignedStaff; expiresAt: number };

export class AssignmentCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private ttlMs: number) {}

  invalidate(patientId: string) {
    this.cache.delete(patientId);
  }

  async get(patientId: string): Promise<AssignedStaff | null> {
    const now = Date.now();
    const hit = this.cache.get(patientId);
    if (hit && hit.expiresAt > now) return hit.value;

    const patient = await Patient.findById(patientId)
      .populate("assignedDoctors assignedNurses", "email name")
      .exec();

    if (!patient) return null;

    const staffIds = [
      ...patient.assignedDoctors.map((d: any) => d._id.toString()),
      ...patient.assignedNurses.map((n: any) => n._id.toString()),
    ];

    const emails = [
      ...patient.assignedDoctors.map((d: any) => d.email).filter(Boolean),
      ...patient.assignedNurses.map((n: any) => n.email).filter(Boolean),
    ];

    const value: AssignedStaff = {
      staffIds,
      emails,
      patientName: patient.name,
    };

    this.cache.set(patientId, { value, expiresAt: now + this.ttlMs });
    return value;
  }
}
