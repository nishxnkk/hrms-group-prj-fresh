import * as PayrollModel from "../models/payroll.model.js";

const allowedStatuses = ["DRAFT", "PROCESSED", "PAID"];

const isAdmin = (user) => user?.role === "Admin";

const normalizeMoney = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Number(number.toFixed(2));
};

const normalizePeriod = (period) => {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return null;
  return `${period}-01`;
};

const toPayrollPayload = (body, createdBy) => {
  const basic_salary = normalizeMoney(body.basic_salary);
  const allowances = normalizeMoney(body.allowances);
  const bonus = normalizeMoney(body.bonus);
  const deductions = normalizeMoney(body.deductions);
  const tax = normalizeMoney(body.tax);
  const net_pay = Number((basic_salary + allowances + bonus - deductions - tax).toFixed(2));
  const status = (body.status || "DRAFT").toUpperCase();

  return {
    user_id: body.user_id,
    pay_period: normalizePeriod(body.pay_period),
    basic_salary,
    allowances,
    bonus,
    deductions,
    tax,
    net_pay,
    status,
    notes: body.notes || "",
    created_by: createdBy,
  };
};

export const listPayroll = async (req, res) => {
  try {
    const userId = isAdmin(req.user) ? req.query.user_id : req.user.id;
    const records = await PayrollModel.listPayrollRecords({
      userId,
      month: req.query.month,
      status: req.query.status,
    });
    return res.json({ success: true, records });
  } catch (err) {
    console.error("listPayroll error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const payrollSummary = async (req, res) => {
  try {
    const userId = isAdmin(req.user) ? req.query.user_id : req.user.id;
    const summary = await PayrollModel.getPayrollSummary({ userId, month: req.query.month });
    return res.json({ success: true, summary });
  } catch (err) {
    console.error("payrollSummary error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyPayroll = async (req, res) => {
  try {
    const records = await PayrollModel.listPayrollRecords({ userId: req.user.id, month: req.query.month });
    return res.json({ success: true, records });
  } catch (err) {
    console.error("getMyPayroll error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPayrollById = async (req, res) => {
  try {
    const record = await PayrollModel.getPayrollRecordById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Payroll record not found" });
    if (!isAdmin(req.user) && String(record.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.json({ success: true, record });
  } catch (err) {
    console.error("getPayrollById error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const savePayroll = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: "Forbidden: Admins only" });

    const payload = toPayrollPayload(req.body, req.user.id);
    if (!payload.user_id || !payload.pay_period) {
      return res.status(400).json({ success: false, message: "Employee and pay period are required" });
    }
    if (!allowedStatuses.includes(payload.status)) {
      return res.status(400).json({ success: false, message: "Invalid payroll status" });
    }
    if (payload.net_pay < 0) {
      return res.status(400).json({ success: false, message: "Net pay cannot be negative" });
    }

    const record = await PayrollModel.upsertPayrollRecord(payload);
    return res.status(201).json({ success: true, record });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ success: false, message: "Employee not found" });
    }
    console.error("savePayroll error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePayrollStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    const status = (req.body.status || "").toUpperCase();
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid payroll status" });
    }
    const record = await PayrollModel.updatePayrollStatus(req.params.id, status);
    if (!record) return res.status(404).json({ success: false, message: "Payroll record not found" });
    return res.json({ success: true, record });
  } catch (err) {
    console.error("updatePayrollStatus error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    const deleted = await PayrollModel.deletePayrollRecord(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Payroll record not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("deletePayroll error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
