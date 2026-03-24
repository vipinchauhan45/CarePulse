import type { VitalData, AlertSeverity } from "./payload.interface.js";

export type AlertType =
  | "heartRate"
  | "oxygenSaturation"
  | "temperature"
  | "meanArterialPressure";

export function getAlertTypes(v: VitalData): AlertType[] {
  const types: AlertType[] = [];

  if (v.heartRate < 60 || v.heartRate > 120) types.push("heartRate");
  if (v.oxygenSaturation < 90) types.push("oxygenSaturation");
  if (v.temperature > 39) types.push("temperature");
  if (v.meanArterialPressure < 65) types.push("meanArterialPressure");

  return types;
}

export function isAbnormal(v: VitalData): boolean {
  return getAlertTypes(v).length > 0;
}

export function getSeverity(v: VitalData): AlertSeverity | null {
  const critical =
    v.heartRate < 40 ||
    v.heartRate > 150 ||
    v.oxygenSaturation < 85 ||
    v.temperature > 40 ||
    v.meanArterialPressure < 55;

  if (critical) return "critical";
  if (isAbnormal(v)) return "high";
  return null;
}
