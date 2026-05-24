import { getItems, getItemById, reduceInventory, createRedemptionRecord, getUserRedemptions } from '../models/redemption.model.js';
import { redeemPoints } from '../models/points.model.js';

export const listItems = async (req, res) => {
  try {
    const items = await getItems();
    res.json({ items });
  } catch (err) {
    console.error('List items error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getItemById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) {
    console.error('Get item error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const purchaseItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { item_id } = req.body;
    const item = await getItemById(item_id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.inventory <= 0) return res.status(400).json({ message: 'Item out of stock' });

    // Try to deduct points (will throw if insufficient)
    const updatedUser = await redeemPoints(userId, item.cost, `Redeemed: ${item.title}`);

    // Reduce inventory and create record
    const inv = await reduceInventory(item_id, 1);
    if (!inv) {
      // rollback points by adding back using addPoints
      try {
        const { addPoints } = await import('../models/points.model.js');
        await addPoints(userId, userId, item.cost, `Rollback for failed inventory change`);
      } catch (e) {
        console.error('Rollback failed', e);
      }
      return res.status(400).json({ message: 'Failed to reserve item' });
    }

    const record = await createRedemptionRecord(userId, item_id, item.cost);

    // Return updated user and record
    res.json({ success: true, user: updatedUser, redemption: record });
  } catch (err) {
    console.error('Purchase error', err);
    if (err.message && err.message.toLowerCase().includes('insufficient')) return res.status(400).json({ message: 'Insufficient points' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const userHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const rows = await getUserRedemptions(userId);
    res.json({ history: rows });
  } catch (err) {
    console.error('User history error', err);
    res.status(500).json({ message: 'Server error' });
  }
};