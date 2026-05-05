import type { Vitals } from "@/types";

const WS_URL = "ws://localhost:8060";

type VitalUpdateCallback = (patientId: string, vitals: Vitals) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: string) => void;

type AlertCallback = (payload: {
   alertId: string;
  severity: "high" | "critical";
  patientId: string;
  patientName: string;
  vitals: Vitals;
  createdAt: string;
  alertTypes?: string[];
}) => void;


type RecoveryCallback = (payload: {
  patientId: string;
  patientName: string;
  createdAt: string;
}) => void;

class WebSocketService {
  private ws: WebSocket | null = null;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private shouldReconnect = true;

  private token: string | null = null;

  private vitalUpdateCallbacks: VitalUpdateCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private alertCallbacks: AlertCallback[] = [];
  private recoveryCallbacks: RecoveryCallback[] = [];

  private joinedRooms = new Set<string>(); // `${machineKey}:${patientId}`

  // ---- SOUND ----
  private audioUnlocked = false;
  private highSound = new Audio("/sounds/high.mp3");
  private criticalSound = new Audio("/sounds/critical.mp3");
  private recoverySound = new Audio("/sounds/recovery.mp3");

  unlockAudio() {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;

    const unlock = async (a: HTMLAudioElement) => {
      try {
        a.volume = 0;
        await a.play();
        a.pause();
        a.currentTime = 0;
        a.volume = 1;
      } catch {}
    };

    void unlock(this.highSound);
    void unlock(this.criticalSound);
    void unlock(this.recoverySound);
  }

  private playAlertSound(severity: "high" | "critical") {
    try {
      const a = severity === "critical" ? this.criticalSound : this.highSound;
      a.currentTime = 0;
      void a.play();
    } catch {}
  }

  private playRecoverySound() {
    try {
      this.recoverySound.currentTime = 0;
      void this.recoverySound.play();
    } catch {}
  }

  // ---- CONNECT ONCE ----
  connect(token: string) {
    this.token = token;
    this.shouldReconnect = true;

    if (this.ws?.readyState === WebSocket.OPEN) return;

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);

      this.ws?.send(
        JSON.stringify({
          type: "connect",
          token: this.token,
          isMachine: "false",
        }),
      );

      for (const key of this.joinedRooms) {
        const [machineKey, patientId] = key.split(":");
        this._sendJoin(machineKey, patientId);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "vitalUpdate" && data.vitals && data.patientId) {
          this.notifyVitalUpdate(data.patientId, data.vitals);
          return;
        }

        if (data.type === "alert") {
  this.playAlertSound(data.severity);
  this.notifyAlert({
    alertId: data.alertId,
    severity: data.severity,
    patientId: data.patientId,
    patientName: data.patientName,
    vitals: data.vitals,
    createdAt: data.createdAt,
    alertTypes: data.alertTypes,
  });
  return;
}


        if (data.type === "recovery") {
          this.playRecoverySound();
          this.notifyRecovery({
            patientId: data.patientId,
            patientName: data.patientName,
            createdAt: data.createdAt,
          });
          return;
        }
      } catch (e) {
        console.error("[WS] parse error", e);
      }
    };

    this.ws.onerror = () => {
      this.notifyError("WebSocket error");
    };

    this.ws.onclose = () => {
      this.notifyConnectionChange(false);

      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          if (this.token) this.connect(this.token);
        }, this.reconnectDelay);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.joinedRooms.clear();
    this.ws?.close();
    this.ws = null;
  }

  // ---- JOIN / LEAVE ----
  join(machineKey: string, patientId: string) {
    const key = `${machineKey}:${patientId}`;
    this.joinedRooms.add(key);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this._sendJoin(machineKey, patientId);
  }

  private _sendJoin(machineKey: string, patientId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: "join",
        machineKey,
        patientId,
        isMachine: "false",
      }),
    );
  }

  leave(machineKey: string, patientId: string) {
    const key = `${machineKey}:${patientId}`;
    this.joinedRooms.delete(key);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: "leave", // backend will treat as "leave room" for staff
        machineKey,
        patientId,
        isMachine: "false",
      }),
    );
  }

  // ---- SUBSCRIPTIONS ----
  onVitalUpdate(cb: VitalUpdateCallback) {
    this.vitalUpdateCallbacks.push(cb);
    return () => {
      this.vitalUpdateCallbacks = this.vitalUpdateCallbacks.filter((x) => x !== cb);
    };
  }

  onConnectionChange(cb: ConnectionCallback) {
    this.connectionCallbacks.push(cb);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((x) => x !== cb);
    };
  }

  onError(cb: ErrorCallback) {
    this.errorCallbacks.push(cb);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((x) => x !== cb);
    };
  }

  onAlert(cb: AlertCallback) {
    this.alertCallbacks.push(cb);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter((x) => x !== cb);
    };
  }

  onRecovery(cb: RecoveryCallback) {
    this.recoveryCallbacks.push(cb);
    return () => {
      this.recoveryCallbacks = this.recoveryCallbacks.filter((x) => x !== cb);
    };
  }

  private notifyVitalUpdate(patientId: string, vitals: Vitals) {
    this.vitalUpdateCallbacks.forEach((cb) => cb(patientId, vitals));
  }

  private notifyConnectionChange(c: boolean) {
    this.connectionCallbacks.forEach((cb) => cb(c));
  }

  private notifyError(e: string) {
    this.errorCallbacks.forEach((cb) => cb(e));
  }

  private notifyAlert(p: Parameters<AlertCallback>[0]) {
    this.alertCallbacks.forEach((cb) => cb(p));
  }

  private notifyRecovery(p: Parameters<RecoveryCallback>[0]) {
    this.recoveryCallbacks.forEach((cb) => cb(p));
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
