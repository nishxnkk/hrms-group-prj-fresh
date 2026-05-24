import pool from '../db/db.js';

const report = async () => {
  try {
    const { rows } = await pool.query("SELECT status, COUNT(*) as count FROM users GROUP BY status ORDER BY count DESC");
    console.log('Status counts:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error fetching status counts:', err);
    process.exit(1);
  }
};

report();
