import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { grantPointsController, getUserPointTransactions } from '../controller/admin.controller.js';

const router = express.Router();

router.post('/users/:id/points', authMiddleware, grantPointsController);
router.get('/users/:id/points', authMiddleware, getUserPointTransactions);

export default router;
