import express from "express";
import {
  scheduleInterview,
  getInterviews
} from "../controller/interview.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Interview routes
router.post("/", authMiddleware, scheduleInterview);
router.get("/", getInterviews);

export default router;
