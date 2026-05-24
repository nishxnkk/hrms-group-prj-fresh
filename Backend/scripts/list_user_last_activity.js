import pool from '../db/db.js';

const list = async () => {
  try {
    const { rows } = await pool.query(`SELECT id, fullname, status, last_activity FROM users ORDER BY last_activity DESC NULLS LAST`);
    console.table(rows.map(r => ({ id: r.id, fullname: r.fullname, status: r.status, last_activity: r.last_activity ? new Date(r.last_activity).toISOString() : null })));
    process.exit(0);
  } catch (err) {
    console.error('Error listing user last_activity:', err);
    process.exit(1);
  }
};

list();
