import { AlertModel } from "../models/Alert.js";

import WebSocket from "ws";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { VitalSigns } from "../models/VitalSigns.js";
import { Patient } from "../models/Patient.js";

import type {
  WebSocketPayload,
  MachineMessagePayload,
  VitalData,
  AlertPayload,
  RecoveryPayload,
} from "./payload.interface.js";

import { getAlertTypes, getSeverity } from "./alertRules.js";
import { CooldownTracker } from "./cooldown.js";
import { AssignmentCache } from "./assignmentCache.js";
import { sendAlertEmail } from "./sendAlertEmail.js";

dotenv.config();

interface DecodedToken {
  _id: string;
  email: string;
  role: "doctor" | "nurse" | "machine";
}

interface Room {
  machineSocket?: WebSocket;
  staffSockets: Set<WebSocket>;
  patientId?: string;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketUserMap: Map<WebSocket, DecodedToken> = new Map();

  private socketsByUserId: Map<string, Set<WebSocket>> = new Map();
  private userIdBySocket: Map<WebSocket, string> = new Map();

  private vitalsBuffer: Map<string, VitalData[]> = new Map();
  private patientState: Map<string, "normal" | "abnormal"> = new Map();

  private uiCooldown = new CooldownTracker(60_000);
  private emailCooldown = new CooldownTracker(15 * 60_000);

  private assignmentCache = new AssignmentCache(120_000);

  constructor() {
    console.log("[WS] RoomManager initialized. Buffer save interval: 5 min");
    setInterval(() => this.saveBufferedVitals(), 5 * 60 * 1000);
  }

  public handleConnection(ws: WebSocket) {
    console.log("[WS] client connected");

    ws.on("message", async (data) => {
      try {
        const msg: WebSocketPayload = JSON.parse(data.toString());

        if (msg.type === "connect") {
          await this.handleConnect(ws, msg);
          return;
        }

        if (msg.type === "join") {
          await this.handleJoin(ws, msg);
          return;
        }

        if (msg.type === "leave") {
          this.handleLeave(ws, msg);
          return;
        }

        if (msg.type === "message") {
          await this.handleMachineMessage(ws, msg);
          return;
        }

        console.log("[WS] invalid message type:", (msg as any).type);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ error: "Invalid message type" }));
        }
      } catch (err) {
        console.error("[WS] invalid message format:", err);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ error: "Invalid message format" }));
        }
      }
    });

    ws.on("close", () => {
      console.log("[WS] client disconnected");
      this.cleanupSocket(ws);
    });
  }

  private addPresence(userId: string, ws: WebSocket) {
    if (!this.socketsByUserId.has(userId)) {
      this.socketsByUserId.set(userId, new Set());
    }
    this.socketsByUserId.get(userId)!.add(ws);
    this.userIdBySocket.set(ws, userId);

    console.log(
      "[PRESENCE] add:",
      userId,
      "sockets:",
      this.socketsByUserId.get(userId)!.size,
    );
  }

  private removePresence(ws: WebSocket) {
    const userId = this.userIdBySocket.get(ws);
    if (!userId) return;

    const set = this.socketsByUserId.get(userId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) this.socketsByUserId.delete(userId);
    }

    this.userIdBySocket.delete(ws);

    console.log(
      "[PRESENCE] remove:",
      userId,
      "remaining:",
      this.socketsByUserId.get(userId)?.size ?? 0,
    );
  }

  private async handleConnect(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.isMachine === "true") {
      this.socketUserMap.set(ws, { _id: "", email: "", role: "machine" });
      console.log("[CONNECT] machine connected (awaiting join)");
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ status: "Machine connected. Send join next." }),
        );
      }
      return;
    }

    const token = "token" in msg ? msg.token : undefined;
    if (!token) {
      console.log("[CONNECT] staff missing token");
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: "Token required" }));
      }
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as DecodedToken;

      if (decoded.role !== "doctor" && decoded.role !== "nurse") {
        console.log("[CONNECT] invalid role:", decoded.role);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ error: "Invalid role" }));
        }
        return;
      }

      this.socketUserMap.set(ws, decoded);
      this.addPresence(decoded._id, ws);

      console.log("[CONNECT] staff connected:", decoded.role, decoded._id);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ status: `${decoded.role} connected` }));
      }
    } catch (err) {
      console.error("[CONNECT] token verify failed:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: "Invalid or expired token" }));
      }
    }
  }

  private async handleJoin(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.type !== "join") return;

    const { machineKey, patientId, isMachine } = msg;

    if (!machineKey || !patientId) {
      console.log("[JOIN] missing machineKey/patientId");
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: "machineKey and patientId required" }));
      }
      return;
    }

    if (isMachine === "true") {
      const patient = await Patient.findById(patientId).exec();
      if (!patient || patient.machineKey !== machineKey) {
        console.log(
          "[JOIN] machine invalid machineKey/patientId:",
          machineKey,
          patientId,
        );
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ error: "Invalid machineKey/patientId" }));
        }
        return;
      }

      if (!this.rooms.has(machineKey))
        this.rooms.set(machineKey, { staffSockets: new Set() });
      const room = this.rooms.get(machineKey)!;
      room.machineSocket = ws;
      room.patientId = patientId;

      console.log("[JOIN] machine joined:", machineKey, "patient:", patientId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ status: "Machine joined patient room" }));
      }
      return;
    }

    const decoded = this.socketUserMap.get(ws);
    if (!decoded) {
      console.log("[JOIN] staff tried without connect/token");
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ error: "Unauthorized. Connect with token first." }),
        );
      }
      return;
    }

    const patient = await Patient.findById(patientId).exec();
    if (!patient) {
      console.log("[JOIN] invalid patientId:", patientId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: "Invalid patientId" }));
      }
      return;
    }

    const isAuthorized =
      (decoded.role === "doctor" &&
        patient.assignedDoctors.some((id) => id.toString() === decoded._id)) ||
      (decoded.role === "nurse" &&
        patient.assignedNurses.some((id) => id.toString() === decoded._id));

    if (!isAuthorized) {
      console.log("[JOIN] not authorized:", decoded._id, "patient:", patientId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: "Not authorized for this patient" }));
      }
      return;
    }

    if (!this.rooms.has(machineKey))
      this.rooms.set(machineKey, { staffSockets: new Set() });
    const room = this.rooms.get(machineKey)!;
    room.staffSockets.add(ws);
    room.patientId = patientId;

    console.log(
      "[JOIN] staff joined room:",
      decoded._id,
      "machineKey:",
      machineKey,
      "patient:",
      patientId,
    );
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ status: "Joined room" }));
    }
    await this.sendActiveAlertsOnJoin(ws, patientId);
  }

  private handleLeave(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.type !== "leave") return;
    const { machineKey, patientId } = msg as any;

    const room = this.rooms.get(machineKey);
    if (!room) return;

    room.staffSockets.delete(ws);

    console.log("[LEAVE] staff left room:", machineKey, "patient:", patientId);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ status: "Left room" }));
    }
  }

  private async handleMachineMessage(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.type !== "message") return;

    const { machineKey, patientId, vitals } = msg as MachineMessagePayload;

    console.log("[VITALS] received:", {
      machineKey,
      patientId,
      hr: vitals.heartRate,
      spo2: vitals.oxygenSaturation,
      map: vitals.meanArterialPressure,
      temp: vitals.temperature,
    });

    const room = this.rooms.get(machineKey);
    const watchers = room?.staffSockets.size ?? 0;
    console.log("[VITALS] watchers in room:", watchers);

    if (room) {
      for (const s of room.staffSockets) {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify({ type: "vitalUpdate", patientId, vitals }));
        }
      }
    }

    if (!this.vitalsBuffer.has(patientId)) this.vitalsBuffer.set(patientId, []);
    this.vitalsBuffer.get(patientId)!.push(vitals);

    this.handleAlerting(patientId, vitals).catch((err) => {
      console.error("[ALERT ERROR]", err);
    });
  }

  private async handleAlerting(patientId: string, vitals: VitalData) {
    const severity = getSeverity(vitals);
    const prev = this.patientState.get(patientId) ?? "normal";
    const next = severity ? "abnormal" : "normal";

    console.log(
      "[ALERT] patient:",
      patientId,
      "prev:",
      prev,
      "next:",
      next,
      "severity:",
      severity,
    );

    if (severity && prev === "normal") {
      this.patientState.set(patientId, "abnormal");

      const alertTypes = getAlertTypes(vitals);
      console.log("[ALERT] triggered types:", alertTypes);

      await this.sendAlertToAssigned(patientId, vitals, severity, alertTypes);
      return;
    }

    if (!severity && prev === "abnormal") {
      this.patientState.set(patientId, "normal");
      console.log("[ALERT] recovery triggered");
      await this.sendRecoveryToAssigned(patientId);
    }
  }

  public async sendAlertToAssigned(
    patientId: string,
    vitals: VitalData,
    severity: "high" | "critical",
    alertTypes: string[],
  ) {
    const staff = await this.assignmentCache.get(patientId);
    if (!staff) {
      console.log("[ALERT] no staff found in cache/db for patient:", patientId);
      return;
    }

    console.log(
      "[ASSIGN] patient:",
      patientId,
      "staffIds:",
      staff.staffIds.length,
      "emails:",
      staff.emails,
    );

    const uiKeys = alertTypes.map((t) => `ui:${patientId}:${t}`);
    const emailKeys = alertTypes.map((t) => `email:${patientId}:${t}`);

    const canSendUI = uiKeys.some((k) => this.uiCooldown.canSend(k));
    const canSendEmail = emailKeys.some((k) => this.emailCooldown.canSend(k));

    console.log("[COOLDOWN] canSendUI:", canSendUI, "keys:", uiKeys);
    console.log("[COOLDOWN] canSendEmail:", canSendEmail, "keys:", emailKeys);


    let newAlert;

    try {
      newAlert = await AlertModel.create({
        patientId,
        patientName: staff.patientName,
        severity,
        vitals,
        alertTypes,
        isActive: true,
        createdAt: new Date(),
      });
    } catch (err: any) {
      //  prevent crash due to duplicate index
      if (err.code === 11000) {
        console.log("[ALERT] duplicate prevented by index");
        return; // stop further execution
      }
      throw err;
    }

    //  THEN CONTINUE YOUR EXISTING LOGIC

    const payload: AlertPayload = {
      type: "alert",
      alertId: newAlert._id.toString(),
      severity,
      patientId,
      patientName: staff.patientName,
      vitals,
      createdAt: newAlert.createdAt.toISOString(),
      alertTypes,
      acknowledged: newAlert.acknowledged,
    };

    if (canSendUI) {
      let delivered = 0;
      for (const userId of staff.staffIds) {
        const sockets = this.socketsByUserId.get(userId);
        if (!sockets) continue;

        for (const s of sockets) {
          if (s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify(payload));
            delivered++;
          }
        }
      }
      console.log("[ALERT] UI delivered sockets:", delivered);
    } else {
      console.log("[ALERT] UI skipped due to cooldown");
    }

    if (canSendEmail) {
      const message = this.buildEmailMessage(staff.patientName, vitals);
      const subject = `Abnormal Vitals for ${staff.patientName} (${severity.toUpperCase()})`;

      //  Recommended: send ONE email using BCC to reduce Gmail quota usage
      const USE_BCC = true;

      if (USE_BCC) {
        try {
          await sendAlertEmail(
            process.env.ALERT_EMAIL_USER as string,
            subject,
            message,
            staff.emails,
          );
          console.log("[EMAIL] BCC sent to:", staff.emails);
        } catch (err) {
          console.error("[EMAIL] BCC failed:", err);
        }
      } else {
        for (const email of staff.emails) {
          try {
            await sendAlertEmail(email, subject, message);
            console.log("[EMAIL] sent to", email);
          } catch (err) {
            console.error("[EMAIL] failed for", email, err);
          }
        }
      }
    } else {
      console.log("[EMAIL] skipped due to cooldown");
    }
  }

  public async sendRecoveryToAssigned(patientId: string) {
    const staff = await this.assignmentCache.get(patientId);
    if (!staff) return;

    // mark alerts inactive
    await AlertModel.updateMany(
      { patientId, isActive: true },
      { isActive: false, resolvedAt: new Date() },
    );

    const payload: RecoveryPayload = {
      type: "recovery",
      patientId,
      patientName: staff.patientName,
      createdAt: new Date().toISOString(),
    };

    let delivered = 0;
    for (const userId of staff.staffIds) {
      const sockets = this.socketsByUserId.get(userId);
      if (!sockets) continue;

      for (const s of sockets) {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify(payload));
          delivered++;
        }
      }
    }

    console.log("[RECOVERY] delivered sockets:", delivered);
  }

  private buildEmailMessage(patientName: string, v: VitalData) {
    return `
  ALERT: Abnormal Vital Signs Detected for ${patientName}

Heart Rate: ${v.heartRate}
Respiratory Rate: ${v.respiratoryRate}
Blood Pressure: ${v.bloodPressure}
Mean Arterial Pressure: ${v.meanArterialPressure}
Oxygen Saturation: ${v.oxygenSaturation}
Temperature: ${v.temperature}
ECG: ${v.ecgWaveform}
End Tidal CO₂: ${v.endTidalCO2}
FiO₂: ${v.fiO2}
Tidal Volume: ${v.tidalVolume}
Central Venous Pressure: ${v.centralVenousPressure}
`.trim();
  }

  private cleanupSocket(ws: WebSocket) {
    this.removePresence(ws);

    for (const [, room] of this.rooms) {
      if (room.machineSocket === ws) delete room.machineSocket;
      room.staffSockets.delete(ws);
    }

    this.socketUserMap.delete(ws);
  }

  private async saveBufferedVitals() {
    for (const [patientId, arr] of this.vitalsBuffer.entries()) {
      if (!arr.length) continue;

      const docs = arr.map((v) => ({ patient: patientId, ...v }));
      await VitalSigns.insertMany(docs);

      console.log("[DB] saved vitals:", arr.length, "patient:", patientId);
      this.vitalsBuffer.set(patientId, []);
    }
  }

  private async sendActiveAlertsOnJoin(ws: WebSocket, patientId: string) {
    try {
      const alerts = await AlertModel.find({
        patientId,
        isActive: true,
      });

      for (const alert of alerts) {
        ws.send(
          JSON.stringify({
            type: "alert",
            alertId: alert._id.toString(),
            patientId: alert.patientId,
            patientName: alert.patientName,
            severity: alert.severity,
            vitals: alert.vitals,
            alertTypes: alert.alertTypes,
            createdAt: alert.createdAt,
            acknowledged: alert.acknowledged ?? false,
          }),
        );
      }
    } catch (err) {
      console.error("[JOIN ALERT ERROR]", err);
    }
  }
}
