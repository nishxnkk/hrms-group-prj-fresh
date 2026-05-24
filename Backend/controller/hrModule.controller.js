import {
  createHrRecord,
  deleteHrRecord,
  getHrSummary,
  listHrRecords,
  updateHrRecord,
} from "../models/hrModule.model.js";

const isAdmin = (req) => req.user?.role === "Admin";

export const listRecords = async (req, res) => {
  try {
    const records = await listHrRecords({ moduleKey: req.params.moduleKey, user: req.user });
    res.json({ success: true, records });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to fetch records" });
  }
};

export const createRecord = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.title || !payload.title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const ownerId = isAdmin(req) ? payload.owner_id || req.user.id : req.user.id;
    const record = await createHrRecord({
      ...payload,
      module_key: req.params.moduleKey,
      owner_id: ownerId,
      created_by: req.user.id,
    });

    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to create record" });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const updates = { ...(req.body || {}) };
    if (!isAdmin(req)) {
      delete updates.assigned_to;
      delete updates.owner_id;
      if (updates.status && !["PENDING", "SUBMITTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(updates.status)) {
        delete updates.status;
      }
    }

    const record = await updateHrRecord(req.params.id, updates);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to update record" });
  }
};

export const removeRecord = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admins only" });
    const deleted = await deleteHrRecord(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete record" });
  }
};

export const summary = async (req, res) => {
  try {
    const data = await getHrSummary(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch summary" });
  }
};
