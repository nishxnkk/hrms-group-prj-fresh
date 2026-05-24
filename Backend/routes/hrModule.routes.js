import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createRecord, listRecords, removeRecord, summary, updateRecord } from "../controller/hrModule.controller.js";

const router = express.Router();

router.get("/summary", authMiddleware, summary);
router.get("/:moduleKey", authMiddleware, listRecords);
router.post("/:moduleKey", authMiddleware, createRecord);
router.put("/:moduleKey/:id", authMiddleware, updateRecord);
router.delete("/:moduleKey/:id", authMiddleware, removeRecord);

export default router;
