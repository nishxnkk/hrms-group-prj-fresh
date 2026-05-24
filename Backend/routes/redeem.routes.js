import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { listItems, getItem, purchaseItem, userHistory } from '../controller/redeem.controller.js';

const router = express.Router();

router.get('/items', listItems);
router.get('/items/:id', getItem);
router.post('/purchase', authMiddleware, purchaseItem);
router.get('/user/:id', authMiddleware, userHistory);

export default router;
