import pool from "../db/db.js";

// Create applications table
export const createApplicationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      resume TEXT,
      status VARCHAR(50) DEFAULT 'APPLIED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Applications table created successfully");
  } catch (error) {
    console.error("❌ Error creating applications table:", error);
  }
};

// Application Model
export const applyJob = (job_id, data) => {
  return pool.query(
    `INSERT INTO applications 
     (job_id, name, email, resume, status)
     VALUES ($1,$2,$3,$4,'APPLIED') RETURNING *`,
    [job_id, data.name, data.email, data.resume]
  );
};

// Get all applications
export const getApplications = () => {
  return pool.query("SELECT * FROM applications");
};

// Update application status
export const updateStatus = (id, status) => {
  return pool.query(
    "UPDATE applications SET status=$1 WHERE id=$2",
    [status, id]
  );
};
