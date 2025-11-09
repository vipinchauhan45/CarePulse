import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { initializeWebSocket } from "./websocket/socket.js";

dotenv.config();

const MONGODB_URI: string = process.env.MONGODB_URI || "";
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

//  Connect MongoDB and start Express
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    server.listen(PORT, () => {
      console.log(` Express API running at http://localhost:${PORT}`);
    });
    //  Initialize WebSocket server (separate function)
    initializeWebSocket();
    console.log(" Successfully connected with MongoDB");
  } catch (e: any) {
    console.error(" Error connecting to database:", e.message);
  }
}

connectDB();
