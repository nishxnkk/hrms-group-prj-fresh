import pool from '../db/db.js';

const run = async () => {
  try {
    const { rows } = await pool.query('SELECT id, fullname, status FROM users ORDER BY id LIMIT 1');
    if (rows.length === 0) {
      console.log('No users found');
      process.exit(0);
    }
    const u = rows[0];
    console.log('Found user:', u);
    const { rows: updated } = await pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING id, fullname, status', ['INACTIVE', u.id]);
    console.log('Updated:', updated[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
