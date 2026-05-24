import pool from "../db/db.js";

// Apply for a job
export const applyJob = async (req, res) => {
  try {
    const job_id = req.params.id;
    const { name, email, coverLetter } = req.body;
    // if file uploaded, multer will attach it as req.file
    const resumeFilename = req.file ? req.file.filename : req.body.resume;

    const result = await pool.query(
      "INSERT INTO applications (job_id, name, email, resume) VALUES ($1,$2,$3,$4) RETURNING *",
      [job_id, name, email, resumeFilename]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Apply job error', err);
    res.status(500).json({ message: 'Application failed' });
  }
};
// Get all applications
export const getApplications = async (req, res) => {
  try {
    const { jobId, status, search, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (jobId) {
      params.push(jobId);
      conditions.push(`job_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR resume ILIKE $${params.length})`);
    }

    params.push(limit);
    params.push(offset);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM applications ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};
// Update application status (Admin only)
export const updateStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { status } = req.body;
    const { id } = req.params;

    await pool.query(
      "UPDATE applications SET status=$1 WHERE id=$2",
      [status, id]
    );

    res.json({ message: "Status updated" });
  } catch (err) {
    console.error('Update status error', err);
    res.status(500).json({ message: 'Failed to update status' });
  }
};
