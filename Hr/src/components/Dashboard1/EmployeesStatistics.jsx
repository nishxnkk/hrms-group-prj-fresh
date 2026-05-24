import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";

export default function HiringStatsChart() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseUrl}/api/dashboard/stats`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        const mappedData = months.map(m => {
          const item = rows.find(r => String(r.month) === m) || {};
          const hires = Number(item.hires || 0);
          const attrition = Number(item.attrition || 0);
          const job_applied = Number(item.job_applied || 0);
          return {
            month: m,
            hires,
            attrition,
            job_applied,
            growth: hires - attrition
          };
        });
        setData(mappedData);
      } else {
        // No data or unexpected shape: initialize zeroed months
        const zeroData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ month: m, hires: 0, attrition: 0, job_applied: 0, growth: 0 }));
        setData(zeroData);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
      const zeroData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ month: m, hires: 0, attrition: 0, job_applied: 0, growth: 0 }));
      setData(zeroData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[400px] bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Monthly Hiring & Resignations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview of employee movement and recruitment activity</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Resigned (YTD)</div>
          <div className="text-xl font-bold text-red-600 dark:text-[#FB923C]">{data.reduce((s, d) => s + (d.attrition || 0), 0)}</div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading dashboard stats…</div>
      ) : (() => {
        const hasData = data && data.some(d => d.hires || d.attrition || d.job_applied);
        if (!hasData) {
          return <div className="p-6 text-center text-gray-500">No hiring data available for the current year.</div>;
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#E6E6E6" strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontSize: '12px' }}
              />

              <Legend
                wrapperStyle={{ paddingTop: '30px', paddingBottom: '10px' }}
                iconType="circle"
                align="center"
                verticalAlign="bottom"
              />

              <Line
                type="monotone"
                dataKey="hires"
                stroke="#2563eb" // Blue-600
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                name="New Hires"
              />

              <Line
                type="monotone"
                dataKey="attrition"
                stroke="#ef4444" // Red-500
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                name="Resigned"
              />

              <Line
                type="monotone"
                dataKey="job_applied"
                stroke="#f59e0b" // Amber-500
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
                activeDot={{ r: 4 }}
                name="Applications"
              />

              <Line
                type="monotone"
                dataKey="growth"
                stroke="#10b981" // Green-500
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                name="Net Growth"
              />

            </LineChart>
          </ResponsiveContainer>
        );
      })()}
    </div>
  );
}