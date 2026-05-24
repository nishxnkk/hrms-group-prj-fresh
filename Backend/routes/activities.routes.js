import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

// Get likes by user (their actions)
router.get('/likes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT al.id as id, al.created_at as created_at, a.id as appreciation_id, a.title, a.message, 
             sender.id as sender_id, sender.fullname as sender_name, recipient.id as recipient_id, recipient.fullname as recipient_name
      FROM appreciation_likes al
      JOIN appreciations a ON al.appreciation_id = a.id
      JOIN users sender ON a.sender_id = sender.id
      JOIN users recipient ON a.recipient_id = recipient.id
      WHERE al.user_id = $1
      ORDER BY al.created_at DESC
      LIMIT 100;
    `;
    const { rows } = await pool.query(query, [userId]);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching activities', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
