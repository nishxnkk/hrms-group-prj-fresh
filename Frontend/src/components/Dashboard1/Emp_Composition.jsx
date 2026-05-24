
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip } from "chart.js";

Chart.register(ArcElement, Tooltip);

export default function EmpComp({ genderStats }) {
  const malePercent = genderStats?.malePercent || 0;
  const femalePercent = genderStats?.femalePercent || 0;
  const total = (genderStats?.male || 0) + (genderStats?.female || 0);
  const chartRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);



  const data = useMemo(
    () => ({
      labels: ["Male", "Female"],
      datasets: [
        {
          data: [malePercent, femalePercent],
          backgroundColor: ["#3b82f6", "#10b981"],
          borderColor: isDarkMode ? "#0f172a" : "#ffffff",
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    }),
    [malePercent, femalePercent, isDarkMode]
  );

  const options = useMemo(
    () => ({
      cutout: "80%", // Thinner ring
      rotation: 0,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
          titleColor: isDarkMode ? '#f1f5f9' : '#111827',
          bodyColor: isDarkMode ? '#9ca3af' : '#4b5563',
          borderColor: isDarkMode ? '#334155' : '#e5e7eb',
          borderWidth: 1,
          padding: 10,
        },
      },
      maintainAspectRatio: false,
    }),
    [isDarkMode]
  );

  return (
    <div className="flex h-[240px] w-full flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Gender Composition</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Distribution of employees by gender</p>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-full max-h-[150px] w-full max-w-[150px]">
          <Doughnut ref={chartRef} data={data} options={options} />

          {/* Center text showing total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400">Total</span>
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{total}</span>
          </div>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="mt-3 flex justify-center gap-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Male</span>
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-slate-100">{malePercent}%</span>
        </div>
        <div className="w-px bg-gray-200 dark:bg-gray-700 h-8 self-center"></div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Female</span>
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-slate-100">{femalePercent}%</span>
        </div>
      </div>
    </div>
  );
}
