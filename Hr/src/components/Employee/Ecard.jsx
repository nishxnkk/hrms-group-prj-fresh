import React, { useEffect, useState } from "react";
import { Mail, Phone, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Ecard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUsers([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        if (!res.ok) {
          let errBody = null;
          try { errBody = await res.json(); } catch { }
          if (res.status === 401) {
            if (errBody && errBody.message === "Token expired") {
              alert("Session expired. Please log in again.");
            }
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
            return;
          }
          setUsers([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUsers(data.users || data);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (d) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return String(d).slice(0, 10);
    }
  };

  const defaultAvatar = "/pexels-olly-927022.jpg";

  if (loading) return <p>Loading employees...</p>;

  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
      {users.map((u) => (
        <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${u.status === "ACTIVE" ? "bg-green-50 text-green-700" : u.status === "DEACTIVE" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
              {u.status || "ACTIVE"}
            </span>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-400">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border border-gray-100 dark:border-slate-700">
              <img src={u.profile_picture ? (u.profile_picture.startsWith('http') ? u.profile_picture : `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${u.profile_picture}`) : defaultAvatar} alt={u.fullname} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg">{u.fullname}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{u.job_title || u.designation || "-"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border-t border-b border-gray-50 dark:border-slate-700 py-4">
            <div className="text-center border-r border-gray-50 dark:border-slate-700">
              <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Department</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{u.department || "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Joined</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{formatDate(u.date_of_joining || u.created_at)}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6 flex-1">
            <a href={`mailto:${u.email}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Mail size={16} className="text-gray-400 dark:text-slate-400" />
              <span className="truncate">{u.email}</span>
            </a>
            <a href={`tel:${u.phone || ""}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Phone size={16} className="text-gray-400 dark:text-slate-400" />
              <span className="truncate">{u.phone || "-"}</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button onClick={() => navigate(`/profile/${u.id}`)} className="w-full py-2 px-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all shadow-sm">
              View Profile
            </button>
            <button onClick={() => navigate(`/chat?userId=${u.id}`)} className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white dark:text-slate-100 text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-all shadow-sm">
              Message
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Ecard;