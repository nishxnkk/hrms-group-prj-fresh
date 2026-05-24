import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Calculator, CheckCircle2, FileText, Loader2, Trash2 } from "lucide-react";
import { focusFirstInvalid, focusField, handleInvalidCapture } from "../utils/formValidation";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const emptyForm = {
  user_id: "",
  pay_period: new Date().toISOString().slice(0, 7),
  basic_salary: "",
  allowances: "",
  bonus: "",
  deductions: "",
  tax: "",
  status: "DRAFT",
  notes: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const monthLabel = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const statusClass = {
  DRAFT: "bg-gray-100 text-gray-700",
  PROCESSED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
};

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#020839] dark:border-slate-600 dark:bg-slate-900";

function Payroll() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [form, setForm] = useState(emptyForm);
  const formRef = useRef(null);
  const deductionsRef = useRef(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "Admin";
  const token = localStorage.getItem("token");

  const netPayPreview = useMemo(() => {
    const basic = Number(form.basic_salary || 0);
    const allowances = Number(form.allowances || 0);
    const bonus = Number(form.bonus || 0);
    const deductions = Number(form.deductions || 0);
    const tax = Number(form.tax || 0);
    return basic + allowances + bonus - deductions - tax;
  }, [form]);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchPayroll = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.set("month", filterMonth);

      const [recordsRes, summaryRes] = await Promise.all([
        fetch(`${apiBase}/api/payroll${params.toString() ? `?${params.toString()}` : ""}`, {
          headers: authHeaders,
        }),
        fetch(`${apiBase}/api/payroll/summary${params.toString() ? `?${params.toString()}` : ""}`, {
          headers: authHeaders,
        }),
      ]);

      if (!recordsRes.ok || !summaryRes.ok) throw new Error("Failed to load payroll");

      const recordsJson = await recordsRes.json();
      const summaryJson = await summaryRes.json();
      setRecords(recordsJson.records || []);
      setSummary(summaryJson.summary || null);
    } catch (err) {
      setError(err.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${apiBase}/api/users`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.users || data || [];
      setEmployees(list.filter((employee) => employee.role !== "Admin"));
    } catch (err) {
      console.warn("Failed to load employees", err);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, [filterMonth]);

  const savePayroll = async (event) => {
    event.preventDefault();
    if (focusFirstInvalid(formRef.current)) return;
    if (netPayPreview < 0) {
      setError("Net pay cannot be negative");
      focusField(deductionsRef.current);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/payroll`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save payroll");
      setForm(emptyForm);
      await fetchPayroll();
    } catch (err) {
      setError(err.message || "Failed to save payroll");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (record, status) => {
    try {
      const res = await fetch(`${apiBase}/api/payroll/${record.id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update status");
      await fetchPayroll();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete payroll for ${record.employee_name}?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/payroll/${record.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to delete payroll");
      await fetchPayroll();
    } catch (err) {
      setError(err.message || "Failed to delete payroll");
    }
  };

  const printSlip = (record) => {
    const html = `
      <html>
        <head>
          <title>Payslip ${record.employee_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { margin-bottom: 4px; }
            .muted { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            td, th { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background: #f9fafb; }
            .total { font-size: 20px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Payroll Slip</h1>
          <div class="muted">${monthLabel(record.pay_period)}</div>
          <p><strong>${record.employee_name}</strong><br />${record.designation || ""} ${record.department ? `- ${record.department}` : ""}</p>
          <table>
            <tr><th>Earnings</th><th>Amount</th></tr>
            <tr><td>Basic Salary</td><td>${money(record.basic_salary)}</td></tr>
            <tr><td>Allowances</td><td>${money(record.allowances)}</td></tr>
            <tr><td>Bonus</td><td>${money(record.bonus)}</td></tr>
            <tr><th>Deductions</th><th>Amount</th></tr>
            <tr><td>Deductions</td><td>${money(record.deductions)}</td></tr>
            <tr><td>Tax</td><td>${money(record.tax)}</td></tr>
            <tr><td class="total">Net Pay</td><td class="total">${money(record.net_pay)}</td></tr>
          </table>
          <p>Status: ${record.status}</p>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 px-8 py-8 text-gray-900 dark:text-slate-100">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">
            {isAdmin ? "Manage monthly payroll and payslip status." : "View your monthly payroll slips."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={filterMonth}
            onChange={(event) => setFilterMonth(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#020839] dark:border-slate-600 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={() => setFilterMonth("")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-700"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric icon={<Banknote size={20} />} label="Net Pay" value={money(summary?.total_net_pay)} />
        <Metric icon={<Calculator size={20} />} label="Deductions" value={money(summary?.total_deductions)} />
        <Metric icon={<CheckCircle2 size={20} />} label="Paid" value={summary?.paid || 0} />
        <Metric icon={<FileText size={20} />} label="Records" value={summary?.records || 0} />
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? "xl:grid-cols-[360px_1fr]" : ""}`}>
        {isAdmin && (
          <form ref={formRef} onInvalidCapture={handleInvalidCapture} onSubmit={savePayroll} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">Create Payroll</h2>
            <Field label="Employee">
              <select
                value={form.user_id}
                onChange={(event) => setForm({ ...form, user_id: event.target.value })}
                className={fieldClass}
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullname} {employee.employee_id ? `(${employee.employee_id})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pay Period">
              <input
                type="month"
                value={form.pay_period}
                onChange={(event) => setForm({ ...form, pay_period: event.target.value })}
                className={fieldClass}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <MoneyField label="Basic" value={form.basic_salary} onChange={(value) => setForm({ ...form, basic_salary: value })} />
              <MoneyField label="Allowances" value={form.allowances} onChange={(value) => setForm({ ...form, allowances: value })} />
              <MoneyField label="Bonus" value={form.bonus} onChange={(value) => setForm({ ...form, bonus: value })} />
              <MoneyField inputRef={deductionsRef} label="Deductions" value={form.deductions} onChange={(value) => setForm({ ...form, deductions: value })} />
              <MoneyField label="Tax" value={form.tax} onChange={(value) => setForm({ ...form, tax: value })} />
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className={fieldClass}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PROCESSED">Processed</option>
                  <option value="PAID">Paid</option>
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className={`${fieldClass} min-h-20`}
              />
            </Field>
            <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-800">
              <div className="text-xs uppercase text-gray-500 dark:text-slate-400">Net Pay</div>
              <div className={`text-xl font-bold ${netPayPreview < 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                {money(netPayPreview)}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#020839] px-4 py-2.5 font-semibold text-white transition hover:bg-[#121a5c] disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
              Save Payroll
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-gray-500">
              <Loader2 className="animate-spin" size={20} />
              Loading payroll
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Period</th>
                    <th className="p-4">Earnings</th>
                    <th className="p-4">Deductions</th>
                    <th className="p-4">Net Pay</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b last:border-b-0 dark:border-slate-700">
                      <td className="p-4">
                        <div className="font-semibold">{record.employee_name}</div>
                        <div className="text-xs text-gray-500">{record.department || record.designation || record.employee_email}</div>
                      </td>
                      <td className="p-4">{monthLabel(record.pay_period)}</td>
                      <td className="p-4">{money(Number(record.basic_salary) + Number(record.allowances) + Number(record.bonus))}</td>
                      <td className="p-4">{money(Number(record.deductions) + Number(record.tax))}</td>
                      <td className="p-4 font-semibold">{money(record.net_pay)}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[record.status] || statusClass.DRAFT}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => printSlip(record)}
                            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            title="Print payslip"
                          >
                            <FileText size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <select
                                value={record.status}
                                onChange={(event) => changeStatus(record, event.target.value)}
                                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                              >
                                <option value="DRAFT">Draft</option>
                                <option value="PROCESSED">Processed</option>
                                <option value="PAID">Paid</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => deleteRecord(record)}
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                title="Delete payroll"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-10 text-center text-gray-500">
                        No payroll records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#020839] text-white">
        {icon}
      </div>
      <div className="text-sm text-gray-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function MoneyField({ label, value, onChange, inputRef }) {
  return (
    <Field label={label}>
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </Field>
  );
}

export default Payroll;
