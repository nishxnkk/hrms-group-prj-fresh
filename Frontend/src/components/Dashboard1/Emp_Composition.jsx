
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
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm w-full h-full flex flex-col min-h-[350px]">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Gender Composition</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Distribution of employees by gender</p>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <div className="w-full h-full max-w-[220px] max-h-[220px] relative ">
          <Doughnut ref={chartRef} data={data} options={options} />

          {/* Center text showing total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-400 dark:text-gray-400 font-medium tracking-wide uppercase">Total</span>
            <span className="text-4xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">{total}</span>
          </div>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Male</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-slate-100">{malePercent}%</span>
        </div>
        <div className="w-px bg-gray-200 dark:bg-gray-700 h-8 self-center"></div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Female</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-slate-100">{femalePercent}%</span>
        </div>
      </div>
    </div>
  );
}