import express from "express";
import { getStats, getOverview } from "../controller/dashboard.controller.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/overview", getOverview);

export default router;
