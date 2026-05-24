import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
    getCourses, addCourse, assignCourse, completeCourse,
    addSkill, getSkills, addCertification, getCertifications
} from "../controller/lms.controller.js";

const router = express.Router();

// Courses
router.get("/courses", authMiddleware, getCourses);
router.post("/courses", authMiddleware, addCourse);
router.post("/assignments", authMiddleware, assignCourse);
router.put("/assignments/:assignment_id/complete", authMiddleware, completeCourse);

// Skills
router.post("/skills", authMiddleware, addSkill);
router.get("/skills/:employee_id", authMiddleware, getSkills);

// Certifications
router.post("/certifications", authMiddleware, addCertification);
router.get("/certifications/:employee_id", authMiddleware, getCertifications);

export default router;

