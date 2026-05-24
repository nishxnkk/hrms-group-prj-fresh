import pool from "../db/db.js";

const addResignedAt = async () => {
    const query = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS resigned_at TIMESTAMP;
  `;
    try {
        await pool.query(query);
        console.log("✅ 'resigned_at' column added to 'users' table successfully");
    } catch (error) {
        console.error("❌ Error adding 'resigned_at' column:", error);
    } finally {
        pool.end();
    }
};

addResignedAt();