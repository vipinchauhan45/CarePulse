import WebSocket, { WebSocketServer } from "ws";
import { RoomManager } from "./roomManager.js";

export function initializeWebSocket() {
  const PORT = 8080; // separate port for websocket
  const wss = new WebSocketServer({ port: PORT });
  const roomManager = new RoomManager();

  wss.on("connection", (ws: WebSocket) => {
    console.log(" New WebSocket client connected");
    roomManager.handleConnection(ws);

    ws.on("close", () => {
      console.log(" WebSocket client disconnected");
    });
  });

  wss.on("listening", () => {
    console.log(` WebSocket server running on ws://localhost:${PORT}`);
  });
}
