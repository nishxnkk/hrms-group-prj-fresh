import { addPoints, getRecentPointTransactions } from '../models/points.model.js';
import { findUserById } from '../models/user.model.js';
import { createAppreciation } from '../models/appreciation.model.js';

export const grantPointsController = async (req, res) => {
  try {
    const adminId = req.user.id;
    // Verify admin role
    const admin = await findUserById(adminId);
    if (!admin || admin.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    const { id } = req.params; // target user ID
    const { amount, reason } = req.body;
    const numeric = parseInt(amount, 10);
    if (!numeric || isFinite(numeric) === false || numeric === 0) return res.status(400).json({ message: 'Invalid amount' });

    const updatedUser = await addPoints(adminId, id, numeric, reason || '');

    // Create an appreciation record so it shows up in the feed (points attached)
    await createAppreciation(adminId, id, 'Points Awarded', 'Reward', reason || 'Points awarded by admin', numeric, '⭐');

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Grant points error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserPointTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const txs = await getRecentPointTransactions(id);
    res.json(txs);
  } catch (err) {
    console.error('Get point txs error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
