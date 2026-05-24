import { useEffect, useState } from "react";
import axios from "axios";

export default function Interviews() {
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const [form, setForm] = useState({
    application_id: "",
    interview_date: "",
    interview_time: "",
    interviewer: "",
    mode: "Online",
  });

  // Fetch applications & interviews
  const fetchData = async () => {
    try {
      const appRes = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/applications`);
      setApplications(
        appRes.data.filter((a) =>
          ["APPLIED", "INTERVIEW"].includes(a.status)
        )
      );

      const intRes = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/interviews`);
      setInterviews(intRes.data);
    } catch (e) {
      console.log("API Error", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Schedule interview
  const scheduleInterview = async (e) => {
    e.preventDefault();

    if (!user || user.role !== 'Admin') {
      alert('Only admins can schedule interviews');
      return;
    }

    // ❌ Block temporary candidates
    if (isNaN(Number(form.application_id))) {
      setError("Temporary candidate selected. Please select a real candidate.");
      return;
    }

    setError("");

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/interviews`, {
        ...form,
        application_id: Number(form.application_id),
      }, { headers: { Authorization: token ? `Bearer ${token}` : '' } });

      alert("Interview Scheduled Successfully");

      setForm({
        application_id: "",
        interview_date: "",
        interview_time: "",
        interviewer: "",
        mode: "Online",
      });

      fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Interview scheduling failed");
    }
  };

  return (
    <div>
      {/* CONTENT */}
      <div className="px-8 mt-10 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: FORM */}
        <div className="lg:col-span-1 ">
          <h2 className="text-xl font-bold mb-6 text-[#020839] dark:text-slate-100">
            Schedule Interview
          </h2>

          {user && user.role === 'Admin' ? (
            <form
              onSubmit={scheduleInterview}
              className="bg-white p-6 rounded-lg shadow-sm border dark:border-none dark:bg-slate-900 dark:text-slate-100"
            >
              <div className="space-y-4">
                {/* Candidate */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Candidate
                  </label>
                  <select
                    value={form.application_id}
                    onChange={(e) =>
                      setForm({ ...form, application_id: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                    required
                  >
                    <option value="" >
                      -- Select Candidate --
                    </option>

                    {/* Real DB candidates */}
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))}
                  </select>

                  {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={form.interview_date}
                      onChange={(e) =>
                        setForm({ ...form, interview_date: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input
                      type="time"
                      value={form.interview_time}
                      onChange={(e) =>
                        setForm({ ...form, interview_time: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Interviewer */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Interviewer
                  </label>
                  <input
                    value={form.interviewer}
                    onChange={(e) =>
                      setForm({ ...form, interviewer: e.target.value })
                    }
                    placeholder="John Doe"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                    required
                  />
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) =>
                      setForm({ ...form, mode: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                  >
                    <option>Online</option>
                    <option>Offline</option>
                  </select>
                </div>

                <button className="w-full py-2 rounded-full bg-[#0066FF] text-white font-bold hover:bg-blue-600 hover:bg-blue-100 dark:hover:bg-blue-600 transition">
                  Schedule Interview
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border text-gray-600 dark:text-slate-100">Only Admins can schedule interviews. You can view upcoming interviews here.</div>
          )}
        </div>
        {/* RIGHT: INTERVIEW LIST */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 text-[#020839] dark:text-slate-100">
            Upcoming Interviews
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border overflow-hidden">
            {interviews.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-slate-100">
                No interviews scheduled yet
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="p-3 text-left dark:text-slate-100">Candidate</th>
                    <th className="p-3 text-left dark:text-slate-100">Date</th>
                    <th className="p-3 text-left dark:text-slate-100">Time</th>
                    <th className="p-3 text-left dark:text-slate-100">Interviewer</th>
                    <th className="p-3 text-left dark:text-slate-100">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((intv, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="p-3 font-medium">
                        {intv.candidate_name ||
                          `Candidate #${intv.application_id}`}
                      </td>
                      <td className="p-3">{intv.interview_date}</td>
                      <td className="p-3">{intv.interview_time}</td>
                      <td className="p-3">{intv.interviewer}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 px-2 py-1 rounded text-xs">
                          {intv.mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
