import pool from "../db/db.js";

const addPointsColumn = async () => {
    const query = `
    ALTER TABLE appreciations 
    ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
  `;
    try {
        await pool.query(query);
        console.log("✅ 'points' column added to 'appreciations' table successfully");
    } catch (error) {
        console.error("❌ Error adding 'points' column:", error);
    } finally {
        pool.end();
    }
};

addPointsColumn();
