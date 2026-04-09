import express from "express";
// import { getActiveAlerts } from "../controllers/alert.controller.js";
// import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getActiveAlerts,
  acknowledgeAlert,
} from "../controllers/alert.controller.js";
import authenticateToken from "../middleware/auth.js";

const alertRoute = express.Router();

//  GET all active alerts for logged-in user
alertRoute.get("/active", authenticateToken, getActiveAlerts);
alertRoute.patch("/:id/acknowledge", authenticateToken, acknowledgeAlert);
export default alertRoute;
