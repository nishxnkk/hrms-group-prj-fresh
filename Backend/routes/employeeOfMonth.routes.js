import express from "express"; // router
import * as EmployeeOfMonthController from "../controller/employeeOfMonth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create new employee of the month with team
router.post("/", authMiddleware, EmployeeOfMonthController.createEmployeeOfMonth);

// Get current employee of the month with team
router.get("/current", authMiddleware, EmployeeOfMonthController.getCurrentEmployeeOfMonth);

// Add team member to employee of the month
router.post("/:id/team", authMiddleware, EmployeeOfMonthController.addTeamMember);

// Delete team member
router.delete("/team/:teamMemberId", authMiddleware, EmployeeOfMonthController.deleteTeamMember);

// Delete employee of the month
router.delete("/:id", authMiddleware, EmployeeOfMonthController.deleteEmployeeOfMonth);

export default router;
