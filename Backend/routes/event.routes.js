import express from "express";
import {
    createEventController,
    getAllEventsController,
    getEventByIdController,
    updateEventController,
    deleteEventController,
    registerAttendeeController,
    getEventAttendeesController,
    removeAttendeeController,
    getUserEventsController,
} from "../controller/event.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Event CRUD routes
router.post("/", authMiddleware, createEventController);
router.get("/", authMiddleware, getAllEventsController);
router.get("/my-events", authMiddleware, getUserEventsController);
router.get("/:id", authMiddleware, getEventByIdController);
router.put("/:id", authMiddleware, updateEventController);
router.delete("/:id", authMiddleware, deleteEventController);

// Attendee management routes
router.post("/:id/register", authMiddleware, registerAttendeeController);
router.get("/:id/attendees", authMiddleware, getEventAttendeesController);
router.delete("/:id/attendees/:userId", authMiddleware, removeAttendeeController);

export default router;
