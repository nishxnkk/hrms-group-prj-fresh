import { useEffect, useState } from "react";
import axios from "axios";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const fetchApplications = async () => {
    // Mocking response for demo if API fails, otherwise use your API
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/applications`);
      setApplications(res.data);
    } catch (e) {
      console.log("API not ready yet");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/applications/${id}/status`, { status }, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      fetchApplications();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SELECTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "INTERVIEW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 border-gray-200";
    }
  };

  return (
    <div>
      <div className="px-8 pb-8 mt-20 dark:bg-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#020839] dark:text-slate-100">Applications</h1>
          <span className="text-gray-500 dark:text-slate-400 text-sm">
            Total: {applications.length}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-none overflow-hidden dark:bg-slate-900">
          <table className="w-full">
            <thead className="bg-gray-50 border-b dark:bg-slate-600">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-100">
                  Candidate
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-100">
                  Job ID
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-100">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-100">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>{applications.map((app) => (<tr key={app.id} className="border-b dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
              <td className="p-4">
                <div className="font-medium text-[#020839] dark:text-slate-100">{app.name}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">{app.email}</div>
              </td>
              <td className="p-4 text-gray-600 dark:text-slate-100">#{app.job_id}</td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                    app.status
                  )}`}
                >
                  {app.status}
                </span>
              </td>
              <td className="p-4">
                {user && user.role === 'Admin' ? (
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#020839]"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-slate-100">{app.status}</div>
                )}
              </td>
            </tr>
            ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-400 ">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
