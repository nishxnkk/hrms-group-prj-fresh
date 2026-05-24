import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  deletePayroll,
  getMyPayroll,
  getPayrollById,
  listPayroll,
  payrollSummary,
  savePayroll,
  updatePayrollStatus,
} from "../controller/payroll.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listPayroll);
router.get("/summary", payrollSummary);
router.get("/me", getMyPayroll);
router.get("/:id", getPayrollById);
router.post("/", savePayroll);
router.patch("/:id/status", updatePayrollStatus);
router.delete("/:id", deletePayroll);

export default router;
