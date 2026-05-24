import pool from '../db/db.js';

const checkUsers = async () => {
    try {
        const res = await pool.query('SELECT id, fullname, email FROM users');
        console.log("Users found:", res.rows.length);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error("Error querying users:", err);
        process.exit(1);
    }
};

checkUsers();
