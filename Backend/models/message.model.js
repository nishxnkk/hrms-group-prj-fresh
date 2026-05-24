import pool from "../db/db.js";

export const createMessagesTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'sent',
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    `;
    try {
        await pool.query(query);
        // Migrations
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent'`);
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`);

        console.log("✅ Messages table created/updated successfully");
    } catch (error) {
        console.error("❌ Error creating messages table:", error);
    }
};

export const createMessage = async (senderId, receiverId, message) => {
    const query = `
        INSERT INTO messages (sender_id, receiver_id, message, status)
        VALUES ($1, $2, $3, 'sent')
        RETURNING *;
    `;
    const result = await pool.query(query, [senderId, receiverId, message]);
    return result.rows[0];
};

export const getMessages = async (userId1, userId2) => {
    const query = `
        SELECT * FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC;
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows;
};

export const updateMessageStatus = async (id, status) => {
    const query = `UPDATE messages SET status = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
};

export const editMessage = async (id, newMessage) => {
    const query = `UPDATE messages SET message = $1, is_edited = TRUE WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [newMessage, id]);
    return result.rows[0];
};

export const deleteMessage = async (id) => {
    // Soft delete: We keep the record but mark as deleted and hide content
    const query = `UPDATE messages SET is_deleted = TRUE, message = '' WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

export const getRecentConversations = async (userId) => {
    if (!userId || isNaN(userId)) return [];

    const query = `
        SELECT DISTINCT ON (other_user_id)
            other_user_id AS id,
            u.fullname AS name,
            u.email AS role,
            CASE 
                WHEN m.is_deleted = TRUE THEN 'This message was deleted'
                ELSE m.message 
            END AS message,
            m.created_at AS time,
            m.status,
            m.sender_id
        FROM (
            SELECT 
                CASE
                    WHEN sender_id = $1 THEN receiver_id
                    ELSE sender_id
                END AS other_user_id,
                message,
                created_at,
                is_deleted,
                status,
                sender_id
            FROM messages
            WHERE sender_id = $1 OR receiver_id = $1
        ) m
        JOIN users u ON u.id = m.other_user_id
        ORDER BY other_user_id, m.created_at DESC;
    `;
    try {
        const result = await pool.query(query, [userId]);
        // Sort by time DESC in JS or wrapper query
        return result.rows.sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch (err) {
        console.error("Error fetching recent conversations:", err);
        return [];
    }
};
