import express from 'express';
import * as PromotionController from '../controller/promotion.controller.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalAuth, PromotionController.listPromotions);
router.get('/:id', optionalAuth, PromotionController.getPromotion);
router.post('/', authMiddleware, PromotionController.createPromotion); // admin only enforced in controller
router.post('/:id/apply', authMiddleware, PromotionController.applyPromotion);
router.get('/:id/applications', authMiddleware, PromotionController.listApplications); // admin only
router.patch('/:id/applications/:appId', authMiddleware, PromotionController.updateApplicationStatus); // admin only
router.get('/me/applications', authMiddleware, PromotionController.userApplications);

export default router;