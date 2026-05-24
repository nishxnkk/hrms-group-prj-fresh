import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Laptop,
  Megaphone,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  createHrRecord,
  deleteHrRecord,
  fetchHrRecords,
  fetchHrSummary,
  updateHrRecord,
} from "../services/hrModuleService";

const MODULES = [
  { key: "leave", label: "Leave", icon: CalendarCheck, titlePlaceholder: "Leave reason", status: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], fields: ["dateRange", "description"] },
  { key: "attendance", label: "Attendance", icon: ClipboardCheck, titlePlaceholder: "Attendance correction", status: ["PENDING", "APPROVED", "REJECTED"], fields: ["dateRange", "description"] },
  { key: "performance", label: "Performance", icon: Star, titlePlaceholder: "Review title", status: ["DRAFT", "IN_REVIEW", "COMPLETED"], fields: ["dateRange", "rating", "description"] },
  { key: "documents", label: "Documents", icon: FileText, titlePlaceholder: "Document name", status: ["SUBMITTED", "VERIFIED", "REJECTED"], fields: ["documentType", "description"] },
  { key: "announcements", label: "Announcements", icon: Megaphone, titlePlaceholder: "Announcement title", status: ["DRAFT", "PUBLISHED", "ARCHIVED"], fields: ["dateRange", "description"] },
  { key: "assets", label: "Assets", icon: Laptop, titlePlaceholder: "Asset name", status: ["ASSIGNED", "RETURNED", "DAMAGED", "LOST"], fields: ["assetTag", "dateRange", "description"] },
  { key: "shifts", label: "Shifts", icon: RotateCcw, titlePlaceholder: "Shift name", status: ["SCHEDULED", "SWAP_REQUESTED", "APPROVED", "CANCELLED"], fields: ["dateRange", "shiftTime", "description"] },
  { key: "expenses", label: "Expenses", icon: ReceiptText, titlePlaceholder: "Expense title", status: ["SUBMITTED", "APPROVED", "REJECTED", "PAID"], fields: ["amount", "description"] },
  { key: "onboarding", label: "Onboarding", icon: BriefcaseBusiness, titlePlaceholder: "Checklist item", status: ["PENDING", "IN_PROGRESS", "COMPLETED"], fields: ["dateRange", "description"] },
  { key: "exit", label: "Exit", icon: ShieldCheck, titlePlaceholder: "Exit request", status: ["REQUESTED", "CLEARANCE", "SETTLED", "CANCELLED"], fields: ["dateRange", "description"] },
];

const defaultForm = {
  title: "",
  description: "",
  status: "",
  start_date: "",
  end_date: "",
  amount: "",
  metadata: {
    documentType: "",
    assetTag: "",
    shiftTime: "",
    rating: "",
  },
};

const statusTone = {
  APPROVED: "bg-green-50 text-green-700 border-green-100",
  COMPLETED: "bg-green-50 text-green-700 border-green-100",
  VERIFIED: "bg-green-50 text-green-700 border-green-100",
  PAID: "bg-green-50 text-green-700 border-green-100",
  REJECTED: "bg-red-50 text-red-700 border-red-100",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
  ARCHIVED: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-100",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
  IN_REVIEW: "bg-blue-50 text-blue-700 border-blue-100",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

export default function HRModules() {
  const [active, setActive] = useState("leave");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);

  const activeModule = useMemo(() => MODULES.find((item) => item.key === active), [active]);
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const isAdmin = user?.role === "Admin";

  const loadRecords = async (moduleKey = active) => {
    setLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        fetchHrRecords(moduleKey),
        fetchHrSummary(),
      ]);
      setRecords(recordsRes.records || []);
      setSummary(summaryRes.data || []);
    } catch (error) {
      window.uiAlert?.(error.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({ ...defaultForm, status: MODULES.find((item) => item.key === active)?.status[0] || "PENDING" });
    setEditingId(null);
    loadRecords(active);
  }, [active]);

  const moduleCount = (moduleKey) =>
    summary.filter((item) => item.module_key === moduleKey).reduce((total, item) => total + Number(item.count || 0), 0);

  const updateMeta = (key, value) => {
    setForm((prev) => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...defaultForm, status: activeModule.status[0] });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: form.amount ? Number(form.amount) : null,
      };
      if (editingId) {
        await updateHrRecord(active, editingId, payload);
      } else {
        await createHrRecord(active, payload);
      }
      resetForm();
      await loadRecords(active);
      window.uiAlert?.(editingId ? "Record updated" : "Record created");
    } catch (error) {
      window.uiAlert?.(error.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const edit = (record) => {
    setEditingId(record.id);
    setForm({
      title: record.title || "",
      description: record.description || "",
      status: record.status || activeModule.status[0],
      start_date: record.start_date ? record.start_date.slice(0, 10) : "",
      end_date: record.end_date ? record.end_date.slice(0, 10) : "",
      amount: record.amount || "",
      metadata: {
        documentType: record.metadata?.documentType || "",
        assetTag: record.metadata?.assetTag || "",
        shiftTime: record.metadata?.shiftTime || "",
        rating: record.metadata?.rating || "",
      },
    });
  };

  const changeStatus = async (record, status) => {
    try {
      await updateHrRecord(active, record.id, { status });
      await loadRecords(active);
    } catch (error) {
      window.uiAlert?.(error.message || "Failed to update status");
    }
  };

  const remove = async (record) => {
    if (!(await window.uiConfirm?.(`Delete "${record.title}"?`))) return;
    try {
      await deleteHrRecord(active, record.id);
      await loadRecords(active);
    } catch (error) {
      window.uiAlert?.(error.message || "Failed to delete record");
    }
  };

  const renderExtraFields = () => (
    <>
      {activeModule.fields.includes("dateRange") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Start date
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            End date
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
        </div>
      )}
      {activeModule.fields.includes("amount") && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Amount
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="0.00" />
        </label>
      )}
      {activeModule.fields.includes("documentType") && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Document type
          <input value={form.metadata.documentType} onChange={(e) => updateMeta("documentType", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="Offer letter, ID proof, certificate..." />
        </label>
      )}
      {activeModule.fields.includes("assetTag") && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Asset tag
          <input value={form.metadata.assetTag} onChange={(e) => updateMeta("assetTag", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="Laptop serial / inventory tag" />
        </label>
      )}
      {activeModule.fields.includes("shiftTime") && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Shift time
          <input value={form.metadata.shiftTime} onChange={(e) => updateMeta("shiftTime", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="09:00 - 18:00" />
        </label>
      )}
      {activeModule.fields.includes("rating") && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Rating
          <select value={form.metadata.rating} onChange={(e) => updateMeta("rating", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            <option value="">Not rated</option>
            <option value="1">1 - Needs improvement</option>
            <option value="2">2 - Developing</option>
            <option value="3">3 - Meets expectations</option>
            <option value="4">4 - Strong</option>
            <option value="5">5 - Excellent</option>
          </select>
        </label>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">HR Operations</p>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">HR Modules</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const activeTab = active === module.key;
            return (
              <button
                key={module.key}
                onClick={() => setActive(module.key)}
                className={`flex min-h-20 items-center gap-3 rounded-lg border px-4 py-3 text-left ${
                  activeTab
                    ? "border-slate-900 bg-white text-slate-950 shadow-sm dark:border-white dark:bg-slate-900 dark:text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <Icon size={20} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{module.label}</span>
                  <span className="text-xs text-slate-400">{moduleCount(module.key)} records</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">{editingId ? "Edit" : "Create"} {activeModule.label}</h2>
              <p className="text-sm text-slate-500">Track requests, approvals, assignments and follow-ups.</p>
            </div>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder={activeModule.titlePlaceholder} />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                {activeModule.status.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>

            {renderExtraFields()}

            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Notes
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="Add details, remarks, links or checklist notes" />
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[var(--rn-action)] px-4 py-2.5 font-semibold text-white hover:bg-[var(--rn-action-hover)] disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">{activeModule.label} Records</h2>
                <p className="text-sm text-slate-500">{isAdmin ? "Admin view" : "Your records"}</p>
              </div>
              <button onClick={() => loadRecords(active)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Refresh
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : records.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No records yet.</div>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950 dark:text-white">{record.title}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[record.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                            {record.status}
                          </span>
                        </div>
                        {record.description && <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{record.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {record.owner_name && <span>Owner: {record.owner_name}</span>}
                          {record.start_date && <span>Start: {formatDate(record.start_date)}</span>}
                          {record.end_date && <span>End: {formatDate(record.end_date)}</span>}
                          {record.amount && <span>Amount: {Number(record.amount).toLocaleString()}</span>}
                          {record.metadata?.documentType && <span>Type: {record.metadata.documentType}</span>}
                          {record.metadata?.assetTag && <span>Asset: {record.metadata.assetTag}</span>}
                          {record.metadata?.shiftTime && <span>Shift: {record.metadata.shiftTime}</span>}
                          {record.metadata?.rating && <span>Rating: {record.metadata.rating}/5</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isAdmin && (
                          <select value={record.status} onChange={(e) => changeStatus(record, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                            {activeModule.status.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        )}
                        <button onClick={() => edit(record)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          Edit
                        </button>
                        {isAdmin && (
                          <button onClick={() => remove(record)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
