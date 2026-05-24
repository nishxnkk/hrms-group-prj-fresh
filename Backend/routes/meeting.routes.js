import express from "express";
import { 
  createMeetingController, 
  getMeetingsController,
  updateMeetingController, // New Import
  deleteMeetingController  // New Import
} from "../controller/meeting.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createMeetingController);
router.get("/", authMiddleware, getMeetingsController);

router.put("/:id", authMiddleware, updateMeetingController);


router.delete("/:id", authMiddleware, deleteMeetingController);

export default router;