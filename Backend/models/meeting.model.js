import pool from "../db/db.js";

export const createMeetingTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        meeting_date DATE,
        start_time TIME,
        end_time TIME,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist for older DBs
    await pool.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_date DATE`);
    await pool.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS start_time TIME`);
    await pool.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS end_time TIME`);
    await pool.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS created_by INTEGER`);
  } catch (err) {
    console.error("Error creating/updating meetings table:", err);
  }
};

export const createMeeting = async (meeting) => {
  const { title, meeting_date, start_time, end_time, created_by } = meeting;

  const result = await pool.query(
    `INSERT INTO meetings (title, meeting_date, start_time, end_time, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [title, meeting_date, start_time, end_time, created_by]
  );

  return result.rows[0];
};

export const getMeetings = async () => {
  const result = await pool.query(
    "SELECT * FROM meetings ORDER BY meeting_date ASC"
  );
  return result.rows;
};

// ✅ NEW: Update an existing meeting
export const updateMeeting = async (id, meeting) => {
  const { title, meeting_date, start_time, end_time } = meeting;
  
  const result = await pool.query(
    `UPDATE meetings 
     SET title = $1, meeting_date = $2, start_time = $3, end_time = $4
     WHERE id = $5
     RETURNING *`,
    [title, meeting_date, start_time, end_time, id]
  );

  return result.rows[0];
};

// ✅ NEW: Delete a meeting
export const deleteMeeting = async (id) => {
  const result = await pool.query(
    `DELETE FROM meetings WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows[0];
};