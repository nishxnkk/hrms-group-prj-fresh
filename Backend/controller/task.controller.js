import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksSummary,
} from "../models/task.model.js";

export const createTaskController = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only admins can create tasks" });
    }

    let { title, description, assigned_to, due_date, percent_completed, status } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) return res.status(400).json({ success: false, message: "Title is required" });

    percent_completed = percent_completed ? Number(percent_completed) : 0;
    if (percent_completed < 0 || percent_completed > 100) return res.status(400).json({ success: false, message: "percent_completed must be between 0 and 100" });

    const allowedStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    // If assigned_to provided, validate user exists
    if (assigned_to) {
      const { findUserById } = await import('../models/user.model.js');
      const asUser = await findUserById(assigned_to);
      if (!asUser) return res.status(400).json({ success: false, message: "Assigned user not found" });
    }

    const created_by = req.user.id;
    const task = await createTask(title, description || '', assigned_to || null, created_by, due_date || null, percent_completed, status || 'pending');

    // Emit activity update if needed
    try { global?.emitActivity?.('tasks:updated'); } catch (e) {}

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Failed to create task", error: error.message });
  }
};

export const getTasksController = async (req, res) => {
  try {
    // If user is not admin, return only assigned tasks
    let { assignedTo } = req.query;

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // If the requester is not an admin, default to their own tasks only when no assignedTo is specified.
    if (req.user.role !== 'Admin' && !assignedTo) {
      assignedTo = req.user.id;
    }

    const tasks = await getTasks(assignedTo);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks", error: error.message });
  }
};

export const updateTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Allow updating only if admin OR the assigned user
    if (req.user.role !== 'Admin' && String(task.assigned_to) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this task" });
    }

    // Validate updates
    if (typeof updates.percent_completed !== 'undefined') {
      const v = Number(updates.percent_completed);
      if (isNaN(v) || v < 0 || v > 100) return res.status(400).json({ success: false, message: 'percent_completed must be a number between 0 and 100' });
      updates.percent_completed = v;
    }

    if (typeof updates.status !== 'undefined') {
      const allowedStatuses = ['pending', 'in_progress', 'completed'];
      if (!allowedStatuses.includes(updates.status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (typeof updates.assigned_to !== 'undefined' && updates.assigned_to !== null) {
      const { findUserById } = await import('../models/user.model.js');
      const asUser = await findUserById(updates.assigned_to);
      if (!asUser) return res.status(400).json({ success: false, message: 'Assigned user not found' });
    }

    // If an admin marks a task as completed, automatically set certification fields
    if (updates.status === 'completed' && req.user.role === 'Admin') {
      updates.certified_by = req.user.id;
      updates.certified_at = new Date();
      updates.percent_completed = 100;
    }

    const updated = await updateTask(id, updates);

    try { global?.emitActivity?.('tasks:updated'); } catch (e) {}

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Failed to update task", error: error.message });
  }
};

export const deleteTaskController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: "Only admins can delete tasks" });
    }

    await deleteTask(id);
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Failed to delete task", error: error.message });
  }
};

export const getTasksSummaryController = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { assignedOnly } = req.query;

    // Only admins can get full summary; non-admins can request for a specific user or their own
    let data;
    if (req.user.role === 'Admin') {
      data = await getTasksSummary(null);
    } else {
      const userId = assignedOnly || req.user.id;
      data = await getTasksSummary(userId);
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tasks summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks summary', error: error.message });
  }
};