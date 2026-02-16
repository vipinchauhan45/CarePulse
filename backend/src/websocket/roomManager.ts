import WebSocket from "ws";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Patient } from "../models/Patient.js";
import { VitalSigns } from "../models/VitalSigns.js";
import { triggerAlertIfAbnormal } from "./alertUtils.js";
import type {
  WebSocketPayload,
  MachineMessagePayload,
  VitalData,
} from "./payload.interface.js";

dotenv.config();

interface DecodedToken {
  _id: string;
  email: string;
  role: "doctor" | "nurse" | "machine";
}

interface Room {
  machineSocket?: WebSocket;
  staffSockets: Set<WebSocket>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private vitalsBuffer: Map<string, VitalData[]> = new Map();
  private socketUserMap: Map<WebSocket, DecodedToken> = new Map();
  private staffSocketsByUserId: Map<string, Set<WebSocket>> = new Map();
private lastAlertAt: Map<string, number> = new Map();
private ALERT_COOLDOWN_MS = 30_000;


  constructor() {
    // Save buffered vitals every 5 minutes
    setInterval(() => this.saveBufferedVitals(), 5 * 60 * 1000);
  }

  public handleConnection(ws: WebSocket) {
    ws.on("message", async (data) => {
      try {
        const msg: WebSocketPayload = JSON.parse(data.toString());

        switch (msg.type) {
          case "connect":
            await this.handleInitialConnect(ws, msg);
            break;

          case "join":
            await this.handleJoin(ws, msg);
            break;

          case "disconnect":
            this.handleDisconnect(ws, msg);
            break;

          case "message":
            await this.handleMessage(msg);
            break;

          default:
            ws.send(JSON.stringify({ error: "Invalid message type" }));
        }
      } catch (err) {
        console.error("Error handling message:", err);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    ws.on("close", () => this.removeSocket(ws));
  }

  // Step 1: First-time connection (doctor/nurse: token | machine: no token)
  private async handleInitialConnect(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.type !== "connect") return;

    if (msg.isMachine === "true") {
      this.socketUserMap.set(ws, { _id: "", email: "", role: "machine" });
      ws.send(JSON.stringify({ status: "Machine connected (waiting for join)" }));
      console.log(" Machine connected (awaiting join)");
    } else {
      const token = "token" in msg ? msg.token : undefined;
      if (!token) {
        ws.send(JSON.stringify({ error: "Token required for staff" }));
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
        this.socketUserMap.set(ws, decoded);
        ws.send(JSON.stringify({ status: `${decoded.role} connected successfully` }));
        console.log(` ${decoded.role} connected and verified`);
      } catch {
        ws.send(JSON.stringify({ error: "Invalid or expired token" }));
      }
    }
  }

//   private async handleInitialConnect(ws: WebSocket, msg: WebSocketPayload) {
//   if (msg.type !== "connect") return;

//   if (msg.isMachine === "true") {
//     this.socketUserMap.set(ws, { _id: "", email: "", role: "machine" });
//     ws.send(JSON.stringify({ status: "Machine connected (waiting for join)" }));
//     console.log("Machine connected (awaiting join)");
//     return;
//   }

//   const token = "token" in msg ? msg.token : undefined;
//   if (!token) {
//     ws.send(JSON.stringify({ error: "Token required for staff" }));
//     return;
//   }

//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET as string
//     ) as DecodedToken;

//     if (decoded.role !== "doctor" && decoded.role !== "nurse") {
//       ws.send(JSON.stringify({ error: "Unauthorized role" }));
//       return;
//     }

//     this.socketUserMap.set(ws, decoded);

//     if (!this.staffSocketsByUserId.has(decoded._id)) {
//       this.staffSocketsByUserId.set(decoded._id, new Set());
//     }
//     this.staffSocketsByUserId.get(decoded._id)!.add(ws);

//     ws.send(JSON.stringify({ status: `${decoded.role} connected successfully` }));
//     console.log(`${decoded.role} connected and registered for alerts`);
//   } catch {
//     ws.send(JSON.stringify({ error: "Invalid or expired token" }));
//   }
// }


  // Step 2: When client (machine or staff) joins a patient room
  private async handleJoin(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.type !== "join") {
      ws.send(JSON.stringify({ error: "Invalid message type for join" }));
      return;
    }

    const { machineKey, patientId, isMachine } = msg;

    if (!machineKey || !patientId) {
      ws.send(JSON.stringify({ error: "machineKey and patientId required" }));
      return;
    }

    if (isMachine === "true") {
      const patient = await Patient.findById(patientId).exec();
      if (!patient || patient.machineKey !== machineKey) {
        ws.send(JSON.stringify({ error: "Invalid machineKey or patientId" }));
        return;
      }

      if (!this.rooms.has(machineKey)) {
        this.rooms.set(machineKey, { staffSockets: new Set() });
      }

      const room = this.rooms.get(machineKey)!;
      room.machineSocket = ws;

      console.log(` Machine joined room for patient ${patient.name}`);
      ws.send(JSON.stringify({ status: "Machine linked to patient" }));
    } else {
      const decoded = this.socketUserMap.get(ws);
      if (!decoded) {
        ws.send(JSON.stringify({ error: "Unauthorized. Please reconnect with token." }));
        return;
      }

      const patient = await Patient.findById(patientId).exec();
      if (!patient) {
        ws.send(JSON.stringify({ error: "Invalid patientId" }));
        return;
      }

      const isAuthorized =
        (decoded.role === "doctor" &&
          patient.assignedDoctors.some((id) => id.toString() === decoded._id)) ||
        (decoded.role === "nurse" &&
          patient.assignedNurses.some((id) => id.toString() === decoded._id));

      if (!isAuthorized) {
        ws.send(JSON.stringify({ error: "Not authorized for this patient" }));
        return;
      }

      if (!this.rooms.has(machineKey)) {
        this.rooms.set(machineKey, { staffSockets: new Set() });
      }

      const room = this.rooms.get(machineKey)!;
      room.staffSockets.add(ws);

      console.log(` ${decoded.role} joined room for patient ${patient.name}`);
      ws.send(JSON.stringify({ status: `${decoded.role} joined patient room` }));
    }
  }

  // Step 3: Handle disconnect
  private handleDisconnect(ws: WebSocket, msg: WebSocketPayload) {
    if (msg.type !== "disconnect") return;

    const isMachine = msg.isMachine;
    const machineKey = "machineKey" in msg ? msg.machineKey : undefined;

    if (isMachine === "true" && machineKey) {
      const room = this.rooms.get(machineKey);
      if (room) {
        delete room.machineSocket;
        console.log(` Machine disconnected from ${machineKey}`);
      }
    }
    this.removeSocket(ws);
  }

  // Step 4: Handle incoming vitals from machine
  private async handleMessage(msg: WebSocketPayload) {
    if (msg.type !== "message") return;
    const { machineKey, patientId, vitals } = msg as MachineMessagePayload;

    const room = this.rooms.get(machineKey);
    if (room) {
      for (const staffSocket of room.staffSockets) {
        staffSocket.send(JSON.stringify({ type: "vitalUpdate", vitals }));
      }
    }

    if (!this.vitalsBuffer.has(patientId)) {
      this.vitalsBuffer.set(patientId, []);
    }
    this.vitalsBuffer.get(patientId)!.push(vitals);

    await triggerAlertIfAbnormal(patientId, vitals);
  }

  // private async handleMessage(msg: WebSocketPayload) {
  // if (msg.type !== "message") return;

  // const { machineKey, patientId, vitals } = msg as MachineMessagePayload;

  // // 1) Optional: still forward live vitals to staff who joined that machine room
  // const room = this.rooms.get(machineKey);
  // if (room) {
  //   for (const staffSocket of room.staffSockets) {
  //     staffSocket.send(JSON.stringify({ type: "vitalUpdate", patientId, vitals }));
  //   }
  // }

  // // 2) Buffer vitals for DB batch insert
  // if (!this.vitalsBuffer.has(patientId)) this.vitalsBuffer.set(patientId, []);
  // this.vitalsBuffer.get(patientId)!.push(vitals);

  // // 3) Abnormal check (same thresholds as your triggerAlertIfAbnormal)
  // const reasons: string[] = [];
  // if (vitals.heartRate < 60 || vitals.heartRate > 120) reasons.push(`Heart Rate: ${vitals.heartRate}`);
  // if (vitals.oxygenSaturation < 90) reasons.push(`SpO₂: ${vitals.oxygenSaturation}`);
  // if (vitals.temperature > 39) reasons.push(`Temperature: ${vitals.temperature}`);
  // if (vitals.meanArterialPressure < 65) reasons.push(`MAP: ${vitals.meanArterialPressure}`);

  // const abnormal = reasons.length > 0;

  // // 4) If abnormal -> send popup to assigned doctors/nurses (Option B)
  // if (abnormal) {
  //   const now = Date.now();
  //   const last = this.lastAlertAt.get(patientId) ?? 0;

  //   // cooldown to prevent popup spam
  //   if (now - last >= this.ALERT_COOLDOWN_MS) {
  //     this.lastAlertAt.set(patientId, now);

  //     const patient = await Patient.findById(patientId)
  //       .select("name assignedDoctors assignedNurses")
  //       .lean();

  //     if (patient) {
  //       const receivers = [
  //         ...patient.assignedDoctors.map(String),
  //         ...patient.assignedNurses.map(String),
  //       ];

  //       const alertPayload = {
  //         type: "alert",
  //         patientId,
  //         patientName: patient.name,
  //         machineKey,
  //         reasons,
  //         vitals,
  //         ts: now,
  //         severity: "critical",
  //       };

  //       for (const userId of receivers) {
  //         const sockets = this.staffSocketsByUserId.get(userId);
  //         if (!sockets) continue;

  //         for (const s of sockets) {
  //           s.send(JSON.stringify(alertPayload));
  //         }
  //       }
  //     }
  //   }
  // }

  // 5) Email alert (you may also want cooldown in email to avoid spam)
//   await triggerAlertIfAbnormal(patientId, vitals);
// }


  private removeSocket(ws: WebSocket) {
    for (const [machineKey, room] of this.rooms) {
      if (room.machineSocket === ws) delete room.machineSocket;
      room.staffSockets.delete(ws);
    }
    this.socketUserMap.delete(ws);
  }

//   private removeSocket(ws: WebSocket) {
//   // Remove from staffSocketsByUserId (Option B registry)
//   const decoded = this.socketUserMap.get(ws);

//   if (decoded && (decoded.role === "doctor" || decoded.role === "nurse")) {
//     const userSockets = this.staffSocketsByUserId.get(decoded._id);
//     if (userSockets) {
//       userSockets.delete(ws);

//       // If no active sockets left for this user, remove entry
//       if (userSockets.size === 0) {
//         this.staffSocketsByUserId.delete(decoded._id);
//       }
//     }

//     console.log(`${decoded.role} socket removed from registry`);
//   }

//   // Remove from patient rooms
//   for (const [, room] of this.rooms) {
//     if (room.machineSocket === ws) {
//       delete room.machineSocket;
//     }
//     room.staffSockets.delete(ws);
//   }

//   // Remove from main socket map
//   this.socketUserMap.delete(ws);
// }


  private async saveBufferedVitals() {
    for (const [patientId, vitalsArray] of this.vitalsBuffer.entries()) {
      if (vitalsArray.length === 0) continue;
      const vitalDocs = vitalsArray.map((v) => ({ patient: patientId, ...v }));
      await VitalSigns.insertMany(vitalDocs);
      console.log(` Saved ${vitalsArray.length} vitals for patient ${patientId}`);
      this.vitalsBuffer.set(patientId, []);
    }
  }
}
