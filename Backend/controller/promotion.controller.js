import * as PromotionModel from '../models/promotion.model.js';

export const createPromotion = async (req, res) => {
  try {
    // Only admins may create promotions
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });

    const { employee_id, new_role, new_salary, reason } = req.body;
    if (!employee_id || !new_role) return res.status(400).json({ success: false, message: 'employee_id and new_role are required' });

    const promotion = await PromotionModel.createPromotion(employee_id, req.user.id, new_role, new_salary || '', reason || '');
    return res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    console.error('createPromotion error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const listPromotions = async (req, res) => {
  try {
    // If non-admin or unauthenticated, only show accepted promotions
    const role = req.user?.role;
    const promotions = await PromotionModel.getPromotions(role === 'Admin' ? undefined : 'accepted');
    return res.json({ success: true, promotions });
  } catch (err) {
    console.error('listPromotions error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await PromotionModel.getPromotionById(id);
    if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found' });
    // If promotion is not accepted and requester is not admin, hide it
    if (promotion.status !== 'accepted' && (!req.user || req.user.role !== 'Admin')) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }
    return res.json({ success: true, data: promotion });
  } catch (err) {
    console.error('getPromotion error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const applyPromotion = async (req, res) => {
  try {
    // Only admins may create applications (per requirement: normal employees should only see final promotions)
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });

    const { id } = req.params; // promotion id
    const { cover_letter } = req.body;

    // Check promotion exists and is open for applications
    const promotion = await PromotionModel.getPromotionById(id);
    if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found' });
    if (promotion.status !== 'published') return res.status(400).json({ success: false, message: 'Promotion not open for applications' });

    const app = await PromotionModel.createPromotionApplication(req.user.id, id, cover_letter || '');
    return res.status(201).json({ success: true, data: app });
  } catch (err) {
    console.error('applyPromotion error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const listApplications = async (req, res) => {
  try {
    // Admin-only
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });

    const { id } = req.params; // promotion id
    const apps = await PromotionModel.getApplicationsByPromotion(id);
    return res.json({ success: true, applications: apps });
  } catch (err) {
    console.error('listApplications error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    // Admin-only
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });

    const { id: promotionId, appId } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    // ensure application belongs to the provided promotion
    const apps = await PromotionModel.getApplicationsByPromotion(promotionId);
    const app = apps.find(a => String(a.id) === String(appId));
    if (!app) return res.status(404).json({ success: false, message: 'Application not found for this promotion' });

    const updated = await PromotionModel.updatePromotionApplicationStatus(appId, status, req.user.id);

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateApplicationStatus error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const userApplications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const apps = await PromotionModel.getUserApplications(req.user.id);
    return res.json({ success: true, applications: apps });
  } catch (err) {
    console.error('userApplications error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};