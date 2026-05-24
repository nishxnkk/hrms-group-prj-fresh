import { useState, useEffect } from "react";
import axios from "axios";
import EmployeesStatistics from "../components/Dashboard1/EmployeesStatistics.jsx";
import StatsCards from "../components/Dashboard1/StatsCard.jsx";
import EmpComposition from "../components/Dashboard1/Emp_Composition.jsx";
import MeetingsUI from "../components/Dashboard1/MeetingsUI.jsx";

function Dashboard1() {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const res = await axios.get(`${baseUrl}/api/dashboard/overview`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard overview", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-page min-h-screen dark:bg-slate-800">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Welcome back, here's what's happening today.</p>
        </div>

        <StatsCards stats={stats} />

        <div className="mt-5">
          <EmployeesStatistics />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="w-full">
            <MeetingsUI />
          </div>
          <div className="w-full">
            <EmpComposition genderStats={stats?.genderComposition} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard1;
