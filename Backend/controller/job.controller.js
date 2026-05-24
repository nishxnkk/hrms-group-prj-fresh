import { createJob, getJobs, deleteJobById } from "../models/job.model.js";

// Create a new job
export const addJob = async (req, res) => {
  try {
    const result = await createJob(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Job creation failed" });
  }
};

// Get all jobs
export const fetchJobs = async (req, res) => {
  try {
    const { search, location, experience, limit, offset, order, dir } = req.query;
    const opts = {
      search,
      location,
      experience,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      order: order || 'created_at',
      dir: dir === 'ASC' ? 'ASC' : 'DESC'
    };

    const result = await getJobs(opts);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// Delete a job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteJobById(id);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Job deletion failed" });
  }
};
