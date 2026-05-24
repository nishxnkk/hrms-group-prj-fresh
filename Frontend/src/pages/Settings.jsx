import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Moon, Star, Link as LinkIcon,
  Shield, FileText, Cookie,
  Phone, MessageSquare, LogOut,
  ChevronRight
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);

  // ✅ Initialize state based on LocalStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // ✅ Toggle Function: Updates State, LocalStorage, and HTML Class
  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Dispatch a custom event so other tabs/components know immediately
    window.dispatchEvent(new Event("storage"));
  };

  // ✅ Ensure class is applied on initial load
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const settingsItems = [
    { icon: <Bell size={22} />, label: 'Notification', hasToggle: true, toggleState: notifications, onToggle: () => setNotifications(!notifications) },
    { icon: <Moon size={22} />, label: 'Dark Mode', hasToggle: true, toggleState: darkMode, onToggle: handleThemeToggle },
    { icon: <Star size={22} />, label: 'Rate App', path: '/settings/rate' },
    { icon: <LinkIcon size={22} />, label: 'Share Link' },
    { icon: <Shield size={22} />, label: 'Privacy Policy', path: '/settings/privacy' },
    { icon: <FileText size={22} />, label: 'Terms and Conditions', path: '/settings/terms' },
    { icon: <Cookie size={22} />, label: 'Cookies Policy', path: '/settings/cookies' },
    { icon: <Phone size={22} />, label: 'Contact', path: '/settings/contact' },
    { icon: <MessageSquare size={22} />, label: 'Feedback', path: '/settings/feedback' },
    { icon: <LogOut size={22} />, label: 'Logout', isLogout: true },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-slate-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 mt-5">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Settings</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Manage your application preferences</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
          {settingsItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-6 py-4 ${
                index !== settingsItems.length - 1 ? 'border-b border-gray-100 dark:border-slate-800' : ''
              } ${
                item.isLogout 
                  ? 'hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer' 
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer'
              } transition-colors duration-200`}
              onClick={async (e) => {
                if (item.hasToggle || item.onToggle) return;
                if (item.path) return navigate(item.path);
                if (item.isLogout) {
                  // ... logout logic ...
                }
              }}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-4 ${
                  item.isLogout 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {item.icon}
                </div>
                <span className={`font-medium ${
                  item.isLogout ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-200'
                }`}>
                  {item.label}
                </span>
              </div>

              <div className="flex items-center">
                {item.hasToggle ? (
                  <div
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      item.toggleState ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onToggle();
                    }}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      item.toggleState ? 'left-7' : 'left-1'
                    }`}></div>
                  </div>
                ) : (
                  <ChevronRight size={20} className="text-gray-400 dark:text-slate-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
