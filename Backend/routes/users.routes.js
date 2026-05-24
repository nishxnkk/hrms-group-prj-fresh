import express from 'express';
import { updateUser } from '../models/user.model.js';

const router = express.Router();

// Update arbitrary allowed fields
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    return res.json(updated);
  } catch (err) {
    console.error('Update user error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
