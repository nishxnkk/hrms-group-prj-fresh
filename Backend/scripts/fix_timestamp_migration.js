import pool from "../db/db.js";

const fixTimestamp = async () => {
    try {
        console.log("🔄 Altering messages table to use TIMESTAMPTZ...");
        await pool.query("ALTER TABLE messages ALTER COLUMN created_at TYPE TIMESTAMPTZ;");
        console.log("✅ Successfully altered created_at to TIMESTAMPTZ");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error altering table:", error);
        process.exit(1);
    }
};

fixTimestamp();
