import pool from "../db/db.js"; // app model

// Create appreciations table
export const createAppreciationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS appreciations (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      emoji VARCHAR(10) DEFAULT '🎉',
      points INTEGER DEFAULT 0,
      source VARCHAR(50) DEFAULT 'feed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);

    // Migration to add source column if it doesn't exist (for existing tables)
    try {
      await pool.query(`ALTER TABLE appreciations ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'feed';`);
    } catch (e) {
      console.log("Column source already exists or error adding it:", e.message);
    }

    console.log("✅ Appreciations table created/verified successfully");
  } catch (error) {
    console.error("❌ Error creating appreciations table:", error);
  }
};

// Create likes table
export const createLikesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS appreciation_likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      appreciation_id INTEGER NOT NULL REFERENCES appreciations(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, appreciation_id)
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Appreciation likes table created successfully");
  } catch (error) {
    console.error("❌ Error creating appreciation likes table:", error);
  }
};

// Create comments table
export const createCommentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS appreciation_comments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      appreciation_id INTEGER NOT NULL REFERENCES appreciations(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Appreciation comments table created successfully");
  } catch (error) {
    console.error("❌ Error creating appreciation comments table:", error);
  }
};

// Create new appreciation
export const createAppreciation = async (senderId, recipientId, title, category, message, points = 0, emoji = '🎉', source = 'feed') => {
  const query = `
    INSERT INTO appreciations (sender_id, recipient_id, title, category, message, points, emoji, source)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [senderId, recipientId, title, category, message, points, emoji, source];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Get all appreciations with sender and recipient details
export const getAllAppreciations = async (sourceFilter = null) => {
  let query = `
    SELECT 
      a.*,
      sender.id as sender_id,
      sender.fullname as sender_name,
      sender.email as sender_email,
      sender.profile_picture as sender_profile_picture,
      recipient.id as recipient_id,
      recipient.fullname as recipient_name,
      recipient.email as recipient_email,
      (SELECT COUNT(*) FROM appreciation_likes WHERE appreciation_id = a.id) as likes_count,
      (SELECT COUNT(*) FROM appreciation_comments WHERE appreciation_id = a.id) as comments_count
    FROM appreciations a
    JOIN users sender ON a.sender_id = sender.id
    JOIN users recipient ON a.recipient_id = recipient.id
  `;

  const params = [];
  if (sourceFilter) {
    query += ` WHERE a.source = $1 `;
    params.push(sourceFilter);
  }

  query += ` ORDER BY a.created_at DESC;`;

  const { rows } = await pool.query(query, params);
  return rows;
};

// Get single appreciation by ID
export const getAppreciationById = async (id) => {
  const query = `
    SELECT 
      a.*,
      sender.id as sender_id,
      sender.fullname as sender_name,
      sender.email as sender_email,
      recipient.id as recipient_id,
      recipient.fullname as recipient_name,
      recipient.email as recipient_email,
      (SELECT COUNT(*) FROM appreciation_likes WHERE appreciation_id = a.id) as likes_count,
      (SELECT COUNT(*) FROM appreciation_comments WHERE appreciation_id = a.id) as comments_count
    FROM appreciations a
    JOIN users sender ON a.sender_id = sender.id
    JOIN users recipient ON a.recipient_id = recipient.id
    WHERE a.id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// Delete appreciation
export const deleteAppreciation = async (id) => {
  const query = "DELETE FROM appreciations WHERE id = $1 RETURNING *;";
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// Like appreciation
export const likeAppreciation = async (userId, appreciationId) => {
  const query = `
    INSERT INTO appreciation_likes (user_id, appreciation_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, appreciation_id) DO NOTHING
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, appreciationId]);
  return rows[0];
};

// Unlike appreciation
export const unlikeAppreciation = async (userId, appreciationId) => {
  const query = `
    DELETE FROM appreciation_likes 
    WHERE user_id = $1 AND appreciation_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, appreciationId]);
  return rows[0];
};

// Get likes count
export const getLikesCount = async (appreciationId) => {
  const query = "SELECT COUNT(*) as count FROM appreciation_likes WHERE appreciation_id = $1;";
  const { rows } = await pool.query(query, [appreciationId]);
  return parseInt(rows[0].count);
};

// Check if user liked appreciation
export const checkUserLiked = async (userId, appreciationId) => {
  const query = "SELECT * FROM appreciation_likes WHERE user_id = $1 AND appreciation_id = $2;";
  const { rows } = await pool.query(query, [userId, appreciationId]);
  return rows.length > 0;
};

// Add comment
export const addComment = async (userId, appreciationId, comment) => {
  const query = `
    INSERT INTO appreciation_comments (user_id, appreciation_id, comment)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, appreciationId, comment]);
  return rows[0];
};

// Delete comment
export const deleteComment = async (commentId) => {
  const query = "DELETE FROM appreciation_comments WHERE id = $1 RETURNING *;";
  const { rows } = await pool.query(query, [commentId]);
  return rows[0];
};

// Get comments for appreciation
export const getComments = async (appreciationId) => {
  const query = `
    SELECT 
      c.*,
      u.fullname as user_name,
      u.email as user_email
    FROM appreciation_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.appreciation_id = $1
    ORDER BY c.created_at ASC;
  `;
  const { rows } = await pool.query(query, [appreciationId]);
  return rows;
};

// Get leaderboard (top recipients by points)
export const getLeaderboard = async () => {
  const query = `
    SELECT 
      users.id,
      users.fullname as name,
      users.profile_picture,
      SUM(appreciations.points) as points
    FROM appreciations
    JOIN users ON appreciations.recipient_id = users.id
    GROUP BY users.id
    ORDER BY points DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};
