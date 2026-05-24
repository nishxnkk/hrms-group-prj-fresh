import pool from "../db/db.js";

// Create offers table
export const createOffersTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      candidate_name VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      salary VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await pool.query(query);
        console.log("✅ Offers table created successfully");
    } catch (error) {
        console.error("❌ Error creating offers table:", error);
    }
};

export const createOffer = (data) => {
    const { application_id, position, salary } = data;
    return pool.query(
        "INSERT INTO offer_letters (application_id, position, ctc) VALUES ($1,$2,$3) RETURNING *",
        [application_id, position, salary] // salary input maps to ctc column
    );
};

export const getOffers = () => {
    return pool.query("SELECT * FROM offer_letters ORDER BY created_at DESC");
};

export const updateOfferStatus = (id, status) => {
    return pool.query(
        "UPDATE offer_letters SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
    );
};
