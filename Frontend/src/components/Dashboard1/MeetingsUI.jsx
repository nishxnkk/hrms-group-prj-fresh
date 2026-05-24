import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import MeetingModal from "./AddMeetingModal";

export default function MeetingsUI() {
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 1. State tracks if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // --- User Role Logic ---
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role==='Admin');
    }

    fetchMeetings();

    // 2. THE "LISTENER" (Optimized)
    const checkTheme = () => {
      const isDark = 
        localStorage.getItem("theme") === "dark" || 
        document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Run once on mount
    checkTheme();

    // Create an observer to watch for class changes on the <html> tag
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const fetchMeetings = () => {
    const token = localStorage.getItem("token");
    if (!token) { setMeetings([]); setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/meetings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setMeetings(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => { setSelectedMeeting(null); setShowModal(true); };
  const handleOpenEdit = (m) => { if (isAdmin) { setSelectedMeeting(m); setShowModal(true); } };

  const handleDeleteDirectly = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/meetings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleMeetingSaved = (saved) => {
    setMeetings((prev) => {
      const exists = prev.find((m) => m.id === saved.id);
      return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved];
    });
  };

  const handleMeetingDeleted = (id) => setMeetings((prev) => prev.filter((m) => m.id !== id));

  const formatMeeting = (m) => {
    const dateObj = new Date(m.meeting_date);
    return {
      ...m,
      fullDate: dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }),
      timeDisplay: `${m.start_time} – ${m.end_time}`,
    };
  };

  return (
    // 3. THE WRAPPER: Applies 'dark' class if state is true
    <div className={`w-full h-full ${isDarkMode ? "dark" : ""}`}>
      
      {/* ✅ FIX: Replaced [.dark_&] with in-[.dark] 
         This means "If inside a .dark container, use this style"
      */}
      <div className="w-full h-full flex flex-col min-h-[300px] bg-white in-[.dark]:bg-gray-900 p-6 rounded-xl shadow-md transition-colors duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 in-[.dark]:text-blue-400 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduled Meetings
          </h2>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add Meeting
            </button>
          )}
        </div>

        {/* Grid Layout */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading && <p className="text-sm text-gray-400">Loading meetings...</p>}
          {!loading && meetings.length === 0 && (
            <p className="text-sm text-gray-400">No meetings scheduled</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!loading &&
              meetings.map((raw, idx) => {
                const m = formatMeeting(raw);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="relative bg-white in-[.dark]:bg-gray-800 border border-gray-200 in-[.dark]:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all group"
                  >
                    
                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(raw)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteDirectly(m.id, e)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    {/* Title Text */}
                    <h4 className="text-gray-900 in-[.dark]:text-gray-100 font-semibold text-lg pr-12 truncate">
                      {m.title}
                    </h4>

                    {/* Date & Time Text */}
                    <div className="mt-1 flex flex-col">
                      <span className="text-xs font-medium text-blue-600 in-[.dark]:text-blue-400 uppercase tracking-wide">
                        {m.fullDate}
                      </span>
                      <p className="text-gray-500 in-[.dark]:text-gray-400 text-sm">
                        {m.timeDisplay}
                      </p>
                    </div>

                    {/* Join Button */}
                    <button className="
                      mt-4 px-4 py-2 rounded-md w-full
                      bg-[#2C50AB] hover:bg-[#3b62c7]
                      text-white text-sm font-medium transition-colors
                    ">
                      Join
                    </button>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 in-[.dark]:border-gray-700">
          <div className="text-xs text-gray-400">Last synced just now</div>
          <button onClick={fetchMeetings} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">
            Sync
          </button>
        </div>

        <MeetingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          meetingToEdit={selectedMeeting}
          onMeetingSaved={handleMeetingSaved}
          onMeetingDeleted={handleMeetingDeleted}
        />
      </div>
    </div>
  );
}