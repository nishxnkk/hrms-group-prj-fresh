import pool from '../db/db.js';

const fixStatuses = async () => {
  try {
    // Set status to 'INACTIVE' for rows where it's NULL or empty
    const { rowCount } = await pool.query(`UPDATE users SET status = 'INACTIVE' WHERE status IS NULL OR trim(status) = '' RETURNING id`);
    console.log(`Updated status for ${rowCount} users (set to 'INACTIVE')`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing user statuses:', err);
    process.exit(1);
  }
};

fixStatuses();
