import { useState, useEffect, useRef } from "react";
import GuardedModal from "../ui/GuardedModal";

// ✅ Notice we use 'onMeetingSaved' here, NOT 'onMeetingAdded'
export default function MeetingModal({ isOpen, onClose, onMeetingSaved, onMeetingDeleted, meetingToEdit = null }) {
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (meetingToEdit) {
        // Edit Mode
        setTitle(meetingToEdit.title);
        const dateObj = new Date(meetingToEdit.meeting_date);
        setMeetingDate(dateObj.toISOString().split('T')[0]);
        setStartTime(meetingToEdit.start_time);
        setEndTime(meetingToEdit.end_time);
      } else {
        // Add Mode
        setTitle("");
        setMeetingDate("");
        setStartTime("");
        setEndTime("");
      }
    }
  }, [isOpen, meetingToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const isEditMode = !!meetingToEdit;
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/meetings/${meetingToEdit.id}`
        : `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/meetings`; 

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          meeting_date: meetingDate,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save meeting");
      }

      // ✅ FIX IS HERE: Call the correct function prop
      if (onMeetingSaved) {
        onMeetingSaved(data.meeting || data);
      }

      onClose();

    } catch (err) {
      window.uiAlert?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(await window.uiConfirm?.("Are you sure you want to cancel this meeting?"))) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/meetings/${meetingToEdit.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete meeting");
      }

      if (onMeetingDeleted) onMeetingDeleted(meetingToEdit.id);
      onClose();

    } catch (err) {
      window.uiAlert?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuardedModal
      onDiscard={onClose}
      onSave={() => formRef.current?.requestSubmit()}
      contentClassName="w-full max-w-[420px] rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900"
    >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
            {meetingToEdit ? "Edit Meeting" : "Add Meeting"}
          </h2>
          {meetingToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 text-sm hover:underline"
            >
              Cancel Meeting
            </button>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Meeting title"
            className="w-full dark:bg-slate-800 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="date"
            className="w-full dark:bg-slate-800 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            required
          />

          <div className="flex gap-2">
            <input
              type="time"
              className="w-full dark:bg-slate-800 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <input
              type="time"
              className="w-full dark:bg-slate-800 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm rounded-md dark:bg-slate-800 border hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm rounded-md font-semibold disabled:opacity-50"
              style={{
                backgroundColor: loading ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                border: "1px solid #1d4ed8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "42px",
              }}
            >
              {loading ? "Saving..." : meetingToEdit ? "Save Changes" : "Save Meeting"}
            </button>
          </div>
        </form>
    </GuardedModal>
  );
}
