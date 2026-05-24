import pool from "../db/db.js"; // db connection

export const createBlacklistTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    try {
        await pool.query(query);
        console.log("✅ Blacklisted Tokens table created successfully");
    } catch (error) {
        console.error("❌ Error creating blacklisted tokens table:", error);
    }
};

export const addToken = async (token) => {
    const query = `
    INSERT INTO blacklisted_tokens (token)
    VALUES ($1)
    RETURNING *;
    `;
    const values = [token];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const isTokenBlacklisted = async (token) => {
    const query = "SELECT * FROM blacklisted_tokens WHERE token = $1";
    const { rows } = await pool.query(query, [token]);
    return rows.length > 0;
};
