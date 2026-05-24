import express from "express";
import {
  addJob,
  fetchJobs,
  deleteJob
} from "../controller/job.controller.js";

const router = express.Router();

// Job routes

// Create a new job
router.post("/", addJob);

// Get all jobs
router.get("/", fetchJobs);

// Delete job by ID
router.delete("/:id", deleteJob);

export default router;
