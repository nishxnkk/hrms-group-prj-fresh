import React from "react";
import { Users, Eye, FileText, UserMinus } from "lucide-react";

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees ?? 0,
      label: "active employees",
      icon: <Users size={20} />,
    },
    {
      title: "Job Views",
      value: stats?.jobViews ?? 0,
      label: "total views",
      icon: <Eye size={20} />,
    },
    {
      title: "Job Applied",
      value: stats?.jobApplications ?? 0,
      label: "total applications",
      icon: <FileText size={20} />,
    },
    {
      title: "Resigned Employees",
      value: stats?.resignedEmployees ?? 0,
      label: "resigned employees",
      icon: <UserMinus size={20} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="group rounded-lg border border-[#ddeeff] bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-[#2c50ab]/30">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {card.title}
            </h3>

            <div
              className="
                p-2 rounded-lg
                bg-[#ddeeff]
                text-[#2c50ab]
                group-hover:bg-[#aaccff]
                dark:bg-[#2c50ab]/30
                dark:text-[#88aaff]
                dark:group-hover:bg-[#2c50ab]/50
                transition-colors duration-300
              "
            >
              {card.icon}
            </div>
          </div>

          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {card.value.toLocaleString()}
          </p>

          <p className="text-xs mt-1 capitalize text-slate-400 dark:text-slate-500">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}
