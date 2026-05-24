import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import people from "../../assets/people.png";
import { Heart, LogOut, Settings, UserPlus, User, } from "lucide-react";

const ProfilePage = ({ onEditProfile, userOverride, tasksOverride }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ activeGoals: 0, progress: 0, completed: 0, dueTasks: 0 });
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async (assignedTo) => {
      try {
        if (tasksOverride && Array.isArray(tasksOverride)) {
          // use supplied tasks from parent view
          const data = tasksOverride || [];
          setTasks(data);

          const now = new Date();
          const completed = data.filter(t => t.status === 'completed').length;
          const totalTasks = data.length;
          const dueTasks = data.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) <= now).length;
          const activeGoals = data.filter(t => t.status === 'in_progress' || (t.status === 'pending' && (t.due_date || t.percent_completed))).length;
          const progress = data.length > 0 ? Math.round(data.reduce((s, t) => s + (Number(t.percent_completed) || 0), 0) / data.length) : 0;
          const completedRate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
          const profileCompletion = Math.min(100, Math.round((progress * 0.6) + (completedRate * 0.4)));
          const score = profileCompletion;
          setStats({ activeGoals, progress, completed, dueTasks, totalTasks, completedRate, profileCompletion, score });
          return;
        }

        const { getTasks } = await import('../../services/taskService.js');
        const resp = await getTasks(assignedTo);
        if (!isMounted) return;
        const data = resp.data || [];
        setTasks(data);

        // recompute stats with richer, clearer semantics
        const now = new Date();
        const completed = data.filter(t => t.status === 'completed').length;
        const totalTasks = data.length;
        const dueTasks = data.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) <= now).length;
        const activeGoals = data.filter(t => t.status === 'in_progress' || (t.status === 'pending' && (t.due_date || t.percent_completed))).length;
        const progress = data.length > 0 ? Math.round(data.reduce((s, t) => s + (Number(t.percent_completed) || 0), 0) / data.length) : 0;
        const completedRate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
        // Profile completion = weighted average of progress and completed rate
        const profileCompletion = Math.min(100, Math.round((progress * 0.6) + (completedRate * 0.4)));
        const score = profileCompletion; // use same metric for circular score

        setStats({ activeGoals, progress, completed, dueTasks, totalTasks, completedRate, profileCompletion, score });
      } catch (err) {
        console.error('Failed to load tasks', err);
      }
    };

    // initial load
    loadTasks(userOverride?.id);

    // refresh when tasks are updated elsewhere (admin, other pages)
    const refresh = () => loadTasks(userOverride?.id);
    window.addEventListener('tasks-updated', refresh);

    return () => { isMounted = false; window.removeEventListener('tasks-updated', refresh); };
  }, [userOverride, tasksOverride]);


  // If a user object is passed via props (viewing another profile), prefer it
  useEffect(() => {
    if (userOverride) {
      setUser(userOverride);
      return;
    }
    const onStorage = (e) => {
      if (e.key === "user") {
        try {
          setUser(JSON.parse(e.newValue));
        } catch {
          setUser(null);
        }
      }
    };

    const onUserUpdated = () => {
      try { setAuthUser(JSON.parse(localStorage.getItem('user') || 'null')); } catch { setAuthUser(null); }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener('user-updated', onUserUpdated);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener('user-updated', onUserUpdated); };
  }, [userOverride]);

  const userData = user ? {
    ...user,
    // Use profile_picture if available, fallback to legacy avatar or null
    avatar: user.profile_picture || user.avatar || null,
    bio: user.bio || "Passionate HR specialist focused on people and culture.",
  } : {
    fullname: "Maria Aryan",
    email: "hrmariaaryan@example.com",
    designation: "HR",
    avatar: null,
    bio: "Passionate HR specialist focused on people and culture.",
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen from-gray-100 to-gray-200 dark:bg-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-gray-100 p-6 sm:p-10">
      <div className="w-full mx-auto">
        {/* HEADER */}
        <div className="flex justify-between">
          {/* <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-100">
              <ArrowLeft />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-gray-600 leading-tigh">Manage your personal information & settings</p>
            </div> */}
          <h2 className="text-2xl font-semibold mb-4">👋 Greetings, {userData.fullname}</h2>
          {/* <button className="inline-flex items-center gap-1 bg-[#ff5b5b] text-black text-sm font-semibold px-5 py-0.5 mr-0.5 rounded-full leading-none hover:bg-[#ff4a4a] active:scale-95 transition cursor-pointer"
            onClick={async () => {
              const { logout } = await import("../../services/auth.service.js");
              await logout();
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}>
            <LogOut className="w-5 h-5" />
              Logout
          </button> */}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT SECTION */}
          <div className="flex-1 space-y-8">

            {/* PROFILE CARD */}
            <section className="bg-white bg-linear-to-b from-[#DCEFFD] to-[#B6D9F3]
    dark:bg-none dark:bg-slate-900 p-6 rounded-xl shadow-xl border border-[#ddeeff] dark:border-slate-800">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Avatar, info */}
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg
    ring-4 ring-blue-200 dark:ring-white/20
    flex items-center justify-center
    bg-gray-100 dark:bg-white/10">
                  {userData.avatar && userData.avatar !== "https://i.pravatar.cc/150?img=5" ? (
                    <img
                      src={userData.avatar}
                      alt={userData.fullname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-gray-400 dark:text-white/70" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{userData.fullname}</h2>
                    <span className="text-gray-500 text-sm">{userData.designation}</span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{userData.email}</p>
                  <p className="text-sm text-gray-500 mt-2 max-w-md">{userData.bio}</p>

                  <div className="mt-5 flex gap-4">
                    {!userOverride && (
                      <>
                        {/* mt-4 px-4 py-2 rounded-md w-full bg-[#2C50AB] hover:bg-[#3b62c7] text-white text-sm font-medium transition-colors cursor-pointer */}
                        <button onClick={onEditProfile} className="mt-3 bg-[#2C50AB] hover:bg-[#3b62c7] text-white px-4 py-2 rounded-md text-sm font-medium shadow-md active:scale-95 transition cursor-pointer">
                          Edit Profile
                        </button>

                        <button onClick={async () => {
                          if (!confirm('Are you sure you want to resign? This will archive and delete your account and log you out.')) return;
                          try {
                            const reason = prompt('Please provide a reason for resignation (optional):');
                            const token = localStorage.getItem('token');
                            const uid = user?.id;
                            if (!token || !uid) return alert('Not authenticated');
                            const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${uid}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ status: 'Resigned', resignation_reason: reason })
                            });
                            if (res.ok) {
                              // log out after resignation
                              const { logout } = await import('../../services/auth.service.js');
                              await logout();
                            } else {
                              const err = await res.json().catch(() => null);
                              alert(err?.message || 'Failed to resign');
                            }
                          } catch (err) {
                            console.error('Resign failed', err);
                            alert('Error processing resignation');
                          }
                        }} className="mt-3 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-red-200 active:scale-95 transition cursor-pointer">
                          Resign
                        </button>
                      </>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-600">Profile Completion {stats.profileCompletion ?? 0}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-[#35A5F5] h-2 rounded-full" style={{ width: `${stats.profileCompletion ?? 0}%` }} />
                  </div>
                </div>

                {/* SMALL CARD */}
                <div className="bg-linear-to-b border border-[#07213c] from-[#DCEFFD] to-[#B6D9F3]
    dark:bg-none
    dark:bg-slate-900
    dark:text-white
    dark:ring-1 dark:ring-white/15
    p-3
    rounded-lg
    w-full
    lg:w-45">
                  <p className="text-xs font-medium">Start where you left –</p>
                  <p className="text-xs font-medium">complete your pending tasks</p>
                  <div className="flex items-center gap-2 mt-6">
                    <img src={people} alt="" className="w-10 h-4" />
                    <p className="text-xs">+7 members involved</p>
                  </div>
                  {/* mt-4 px-4 py-2 rounded-md w-full bg-[#2C50AB] hover:bg-[#3b62c7] text-white text-sm font-medium transition-colors   */}
                  <button className="mt-4 px-4 py-2 rounded-md w-full
                      bg-[#2C50AB] hover:bg-[#3b62c7]
                      text-white text-sm font-medium transition-colors cursor-pointer">Jump to the task</button>
                </div>
              </div>
            </section>

            {/* WORK OVERFLOW */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Work Overflow</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ">
                {[
                  { label: "Active goals", value: stats.activeGoals || 0 },
                  { label: "Progress", value: stats.progress ? `${stats.progress}%` : '0%' },
                  { label: "Completed", value: stats.completed || 0 },
                  { label: "Due Tasks", value: stats.dueTasks || 0 }
                ].map((item, index) => (
                  /* group bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#ddeeff] dark:border-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-[#2c50ab]/30 hover:-translate-y-1 transition-all duration-300 ease-out */
                  <div
                    key={index}
                    className="bg-[#DDEFFF] dark:bg-slate-900 p-4 rounded-xl flex justify-between items-center border border-[#ddeeff] dark:border-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-[#2c50ab]/30 hover:-translate-y-1 transition-all duration-300 ease-out"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xl font-bold mt-1">{item.value}</p>
                    </div>
                    <span className="text-lg font-semibold">❯</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DUE TASKS */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Complete Due Tasks</h3>

              <div className="space-y-3">
                {tasks.length === 0 && (
                  <div className="bg-[#DDEFFF] dark:bg-slate-900 p-4 rounded-xl flex justify-between items-center shadow-sm">No tasks assigned</div>
                )}

                {tasks.map((task, index) => {
                  const canMark = authUser && (authUser.role === 'Admin' || String(authUser.id) === String(task.assigned_to));
                  const isCompleted = task.status === 'completed';
                  return (
                    <div key={task.id || index} className="bg-[#e6f0fb] p-4 rounded-lg flex justify-between items-center shadow-md">
                      <div>
                        <p className="font-semibold">{index + 1}. {task.title}</p>
                        <p className="text-sm font-medium mt-1">Assigned by: {task.created_by_name || '—'}</p>
                        <p className="text-sm text-gray-500 mt-1">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</p>
                        {isCompleted && (
                          <p className="text-xs text-gray-500 mt-1">Completed: {task.certified_at ? new Date(task.certified_at).toLocaleString() : (task.updated_at ? new Date(task.updated_at).toLocaleString() : '—')}</p>
                        )}
                        {isCompleted && task.certified_by_name && (
                          <p className="text-xs text-gray-500">Certified by: {task.certified_by_name}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-11 rounded-full bg-[#6d5dfc] flex items-center justify-center text-white text-xs font-semibold">
                          {task.percent_completed ? `${task.percent_completed}%` : '—'}
                        </div>

                        {!isCompleted && canMark ? (
                          <button onClick={async () => {
                            try {
                              const { updateTask } = await import('../../services/taskService.js');
                              // Admins certify, users mark complete
                              if (authUser.role === 'Admin') {
                                await updateTask(task.id, { status: 'completed' });
                              } else {
                                await updateTask(task.id, { status: 'completed', percent_completed: 100 });
                              }

                              await (async () => { const { getTasks } = await import('../../services/taskService.js'); const res = await getTasks(userOverride?.id); setTasks(res.data || []); })();
                              window.dispatchEvent(new Event('tasks-updated'));
                            } catch (err) {
                              console.error('Failed to mark complete', err);
                            }
                          }} className="px-3 py-1 rounded-md bg-green-600 text-white text-sm">{authUser?.role === 'Admin' ? 'Certify & Mark done' : 'Mark complete'}</button>
                        ) : (
                          <span className="px-2 py-1 rounded-md bg-gray-200 text-sm">{isCompleted ? 'Completed' : 'Not allowed'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="mt-5 shadow-md">
              <h3 className="mt-1.5 mb-3 text-[18px] font-semibold">Quick actions</h3>
              { /* group bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#ddeeff] dark:border-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-[#2c50ab]/30 hover:-translate-y-1 transition-all duration-300 ease-out */}
              <div className="relative bg-[#DDEFFF] dark:bg-slate-900
text-gray-900 dark:text-white
p-5.5 rounded-[14px]">
                {/* Center separator */}
                <div className="absolute top-4 bottom-4 left-1/2 w-px bg-[#cbd5e1] dark:bg-white/20" />
                <div className="grid grid-cols-2 gap-y-4.5 gap-x-10">
                  {/* Latest Feeds */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="4" y="4" width="16" height="16" />
                      <path d="M8 9h8M8 13h6" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/feed')}>Latest Feeds</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 21s6-5.3 6-10a6 6 0 10-12 0c0 4.7 6 10 6 10z" />
                      <circle cx="12" cy="11" r="2" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/location')}>Location</span>
                  </div>

                  {/* Latest Uploads */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 16V4" />
                      <path d="M8 8l4-4 4 4" />
                      <path d="M4 20h16" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/uploads')}>Latest Uploads</span>
                  </div>

                  {/* Recently deleted */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18" />
                      <path d="M8 6v14h8V6" />
                      <path d="M10 10v6M14 10v6" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/deleted')}>Recently deleted</span>
                  </div>

                  {/* Languages */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 5h8" />
                      <path d="M8 5v14" />
                      <path d="M4 19h8" />
                      <path d="M14 7h6" />
                      <path d="M17 7v10" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/languages')}>Languages</span>
                  </div>

                  {/* Clear History */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 12a9 9 0 109-9" />
                      <path d="M3 3v6h6" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/clear-history')}>Clear History</span>
                  </div>

                  {/* Display */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="4" width="18" height="12" />
                      <path d="M8 20h8" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/display')}>Display</span>
                  </div>

                  {/* Files & Documents */}
                  <div className="flex items-center gap-3 
hover:bg-gray-100 dark:hover:bg-white/10 
cursor-pointer rounded-md p-1" >
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 3h8l4 4v14H6z" />
                      <path d="M14 3v5h5" />
                    </svg>
                    <span className="text-[16px] font-semibold" onClick={() => navigate('/profile/files')}>Files &amp; Documents</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE MENU SECTIONS */}
            {/* <SectionCard>
              <MenuItem icon={<Heart />} label="Latest feed" onClick={() => navigate('/profile/feed')} />
              <MenuItem icon={<Download />} label="Latest uploads" onClick={() => navigate('/profile/uploads')} />
            </SectionCard>

            <SectionCard>
              <MenuItem icon={<Globe />} label="Languages" onClick={() => navigate('/profile/languages')} />
              <MenuItem icon={<MapPin />} label="Location" onClick={() => navigate('/profile/location')} />
              <MenuItem icon={<FileText />} label="Files and documents" onClick={() => navigate('/profile/files')} />
              <MenuItem icon={<Monitor />} label="Display" onClick={() => navigate('/profile/display')} />
            </SectionCard>

            <SectionCard>
              <MenuItem icon={<Trash2 />} label="Recently deleted" onClick={() => navigate('/profile/deleted')} />
              <MenuItem icon={<Clock />} label="Clear History" onClick={() => navigate('/profile/clear-history')} />
              <MenuItem icon={<LogOut className="rotate-180" />} label="Exit" onClick={() => navigate('/profile/exit')} />
            </SectionCard> */}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-80">
            <div className="bg-[#DDEFFF] dark:bg-slate-900
text-gray-900 dark:text-white
rounded-3xl px-4 py-5 space-y-5">
              {/* top-right ? icon */}
              <div className="flex justify-end">
                <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-gray-600 shadow-sm">?</button>
              </div>

              {/* circular score */}
              <div className="flex justify-center">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    {/* background circle */}
                    <path className="text-[#C3DBFF]" stroke="currentColor" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {/* progress arc */}
                    <path className="text-[#8B5CF6]" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${stats.score ?? 0} 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold">{stats.score ?? 0}%</span>
                    <span className="text-xs text-gray-600 -mt-0.5">Score</span>
                  </div>
                </div>
              </div>

              {/* Fantastic job pill */}
              <div className="flex justify-center">
                <button className="inline-flex items-center gap-2 rounded-full bg-[#2F9DF7] text-white text-xs font-medium px-4 py-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500" />Fantastic job</button>
              </div>

              {/* Statistics header */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm font-semibold dark:text-gray-100">Statistics</p>
                <button className="inline-flex items-center gap-1 bg-[#2F9DF7] text-white text-xs px-3 py-1 rounded-full shadow-sm">
                  <span>Nov</span>
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Statistic cards */}
              <div className="space-y-3">
                {(() => {
                  const total = stats.totalTasks || 0;
                  const completedRate = total ? Math.round((stats.completed / total) * 100) : 0;
                  const innovationPercent = total ? Math.round((stats.dueTasks / total) * 100) : 0;
                  const statItems = [
                    { title: 'Performance', subtitle: 'Based on work', percent: `${stats.progress ?? 0}%`, badge: null },
                    { title: 'Success', subtitle: 'Based on tasks', percent: `${completedRate}%`, badge: (total && stats.completed < total) ? 'Active' : null },
                    { title: 'Innovation', subtitle: 'Pending/Due', percent: `${innovationPercent}%`, badge: stats.dueTasks > 0 ? `${stats.dueTasks} due` : null },
                  ];

                  return statItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#E7F3FF] dark:bg-slate-800
text-gray-900 dark:text-white
rounded-2xl px-3 py-3 flex items-center justify-between shadow-sm">
                      {/* left text & percent chip */}
                      <div className="flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-semibold dark:text-gray-100">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-300">
                            {item.subtitle}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-semibold text-[#4B7AD6]">
                            {item.percent}
                          </span>
                          {item.badge && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#2F9DF7] text-[10px] font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* simple line chart on right */}
                      <svg viewBox="0 0 80 32" className="w-16 h-10 text-[#6a6666]" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="0,24 12,20 24,22 36,14 48,18 60,10 72,14 80,6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ))
                })()}
              </div>
            </div>

            <br />
            {/* bottom right section */}
            <div className="bg-[#E5F4FF] dark:bg-slate-900
text-gray-900 dark:text-gray-100
rounded-xl shadow-xl p-6">
              <div className="space-y-2">
                <SidebarItem icon={<Heart />} label="Appreciations" onClick={() => navigate('/recognition')} />
                <SidebarItem icon={<UserPlus />} label="My Referrals" onClick={() => navigate('/profile/referrals')} />
                <SidebarItem icon={<Settings />} label="Settings" onClick={() => navigate('/settings')} />
                <button className="w-full bg-red-50 text-red-600 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-100 active:scale-95 transition"
                  onClick={async () => {
                    const { logout } = await import("../../services/auth.service.js");
                    await logout();
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                  }}>
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* COMPONENTS */

const SectionCard = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
    <div className="space-y-5">{children}</div>
  </div>
);

const MenuItem = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-4 w-full text-left group p-3 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition">
    <span className="text-gray-700 group-hover:text-[#266ECD] transition">{icon}</span>
    <span className="text-lg font-medium text-gray-900 group-hover:text-[#266ECD] transition">
      {label}
    </span>
  </button>
);

const SidebarItem = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-3 w-full text-left text-gray-600 dark:text-gray-100 hover:text-[#266ECD] hover:bg-gray-100 p-3 rounded-xl active:scale-[0.98] transition">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default ProfilePage;
