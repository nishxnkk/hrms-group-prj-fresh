import express from "express";
import multer from "multer";
import path from "path";
import { applyJob, getApplications, updateStatus } from "../controller/application.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// simple storage for application uploads (store in same uploads folder)
const uploadDir = path.join(process.cwd(), 'assets', 'uploads');
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const ts = Date.now();
		const safe = file.originalname.replace(/[^a-zA-Z0-9\.\-\_]/g, '_');
		cb(null, `${ts}_${safe}`);
	}
});
const upload = multer({ storage });

// Job application routes
// Accept multipart form with `resume` file field
router.post("/jobs/:id/apply", upload.single('resume'), applyJob);
router.get("/applications", getApplications);
router.patch("/applications/:id/status", authMiddleware, updateStatus);

export default router;
