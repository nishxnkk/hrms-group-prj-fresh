import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { User } from "lucide-react";

function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    };
    loadUser();

    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, []);

  const fullname = user?.fullname || "Mariya";
  const designation = user?.designation || "HR Manager";
  const email = user?.email || "";
  const avatarSrc = user?.profile_picture;

  const [taskStats, setTaskStats] = useState({ completed: 0, remaining: 0, overdue: 0, total: 0 });
  const [loadingTasks, setLoadingTasks] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Chat", path: "/chat" },
    { name: "Employees", path: "/employees" },
    { name: "Feed", path: "/feed" },
    { name: "Recognition", path: "/recognition" },
    { name: "Event", path: "/event" },
    { name: "Recruitment", path: "/recruitment" },
    { name: "Profile", path: "/profile" },
    { name: "Settings", path: "/settings" },
  ];

  // Determine the tasks link destination based on user role
  const tasksLink = user && user.role === 'Admin' ? '/admin/tasks' : '/profile/tasks';
  const tasksActive = location.pathname.startsWith('/admin/tasks') || location.pathname.startsWith('/profile/tasks');

  // Load tasks summary
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { getTasks } = await import('../../services/taskService.js');
        setLoadingTasks(true);
        const res = await getTasks();
        if (!isMounted) return;
        const data = res.data || [];
        const now = new Date();
        const completed = data.filter(t => t.status === 'completed').length;
        const remaining = data.filter(t => t.status !== 'completed').length;
        const overdue = data.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;
        setTaskStats({ completed, remaining, overdue, total: data.length });
      } catch (err) {
        console.warn('Failed to load task stats', err);
        setTaskStats({ completed: 0, remaining: 0, overdue: 0, total: 0 });
      } finally {
        setLoadingTasks(false);
      }
    })();

    const onUserUpdated = () => {
      // recalc when user changes
      (async () => {
        try {
          const { getTasks } = await import('../../services/taskService.js');
          setLoadingTasks(true);
          const res = await getTasks();
          const data = res.data || [];
          const now = new Date();
          const completed = data.filter(t => t.status === 'completed').length;
          const remaining = data.filter(t => t.status !== 'completed').length;
          const overdue = data.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;
          setTaskStats({ completed, remaining, overdue, total: data.length });
        } catch (err) {
          setTaskStats({ completed: 0, remaining: 0, overdue: 0, total: 0 });
        } finally {
          setLoadingTasks(false);
        }
      })();
    };

    window.addEventListener('user-updated', onUserUpdated);
    window.addEventListener('tasks-updated', onUserUpdated);
    return () => { isMounted = false; window.removeEventListener('user-updated', onUserUpdated); window.removeEventListener('tasks-updated', onUserUpdated); };
  }, []);

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#020839] dark:bg-[#2C50AB] text-white dark:text-[#AACCFF] p-6">

      {/* LOGO */}
      <h1 className="text-3xl font-bold mb-8 tracking-wide">HRMS</h1>

      {/* PROFILE */}
      <div className="flex items-center gap-3 mb-10">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
            alt={fullname}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/80 border-2 border-white/20">
            <User size={24} />
          </div>
        )}

        <div className="min-w-0">
          <p className="font-semibold truncate max-w-[140px]">{fullname}</p>
          <p className="text-sm opacity-70 capitalize truncate max-w-[140px]">{designation}</p>
        </div>
      </div>

      {/* MENU */}
      <ul className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded-lg font-medium ${isActive
                  ? "bg-white text-[#020839]"
                  : "text-white dark:text-[#AACCFF] hover:bg-[#1e276d] dark:hover:bg-[#88AAFF] dark:hover:text-[#020839]"
                  }`}
              >
                {item.name}
              </Link>
            </li>
          );
        })}

        {/* Tasks (role-aware): users => /profile/tasks, admins => /admin/tasks */}
        <li>
          <Link
            to={tasksLink}
            className={`block px-4 py-2 rounded-lg font-medium ${tasksActive
              ? "bg-white text-[#020839]"
              : "text-white dark:text-[#AACCFF] hover:bg-[#1e276d] dark:hover:bg-[#88AAFF] dark:hover:text-[#020839]"
              }`}
          >
            <div className="flex items-center justify-between">
              <span>Tasks</span>
              <div className="flex items-center gap-2">
                {loadingTasks ? (
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {taskStats.overdue > 0 && (
                      <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5">{taskStats.overdue}</span>
                    )}
                    {taskStats.remaining > 0 && (
                      <span className="text-xs bg-white text-[#020839] rounded-full px-2 py-0.5">{taskStats.remaining}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
