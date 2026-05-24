import pool from "../db/db.js";

// Schedule an interview (Admin only)
export const scheduleInterview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const {
      application_id,
      interview_date,
      interview_time,
      interviewer,
      mode
    } = req.body;

    await pool.query(
      `INSERT INTO interviews 
       (application_id, interview_date, interview_time, interviewer, mode)
       VALUES ($1,$2,$3,$4,$5)`,
      [application_id, interview_date, interview_time, interviewer, mode]
    );

    res.status(201).json({ message: "Interview scheduled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Interview scheduling failed" });
  }
};

// Get all interviews
export const getInterviews = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, a.name AS candidate_name
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      ORDER BY interview_date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Fetching interviews failed" });
  }
};
