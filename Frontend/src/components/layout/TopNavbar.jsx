import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckSquare, LogOut, UserCircle } from "lucide-react";
import { logout } from "../../services/auth.service";

export default function TopNavbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };

    loadUser();
    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, []);

  const avatarSrc = user?.profile_picture;
  const taskPath = user?.role === "Admin" ? "/admin/tasks" : "/profile/tasks";

  const handleLogout = async () => {
    if (!(await window.uiConfirm?.("Logout from your account?"))) return;
    await logout();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {user?.fullname || "HRMS User"}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {user?.designation || user?.role || "Team member"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <UserCircle size={16} />
            <span className="hidden sm:inline">View Profile</span>
          </Link>

          <Link
            to={taskPath}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <CheckSquare size={16} />
            <span className="hidden sm:inline">My Tasks</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--rn-action)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--rn-action-hover)]"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>

          <Link to="/profile" aria-label="Open profile" className="shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.fullname || "Profile"}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <UserCircle size={22} />
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
