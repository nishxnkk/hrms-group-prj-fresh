import { useEffect, useState } from "react";
import axios from "axios";
export default function Offers() {
  const [candidates, setCandidates] = useState([]);
  const [offers, setOffers] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const [form, setForm] = useState({
    application_id: "",
    position: "",
    ctc: "",
    joining_date: ""
  });


  const fetchData = async () => {
    try {
      const appRes = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/applications`);
      // Only show candidates who are SELECTED
      setCandidates(appRes.data.filter(a => a.status === "SELECTED"));

      const offerRes = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/offers`);
      setOffers(offerRes.data);
    } catch (e) { console.log("API Error") }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createOffer = async (e) => {
    e.preventDefault();

    if (!user || user.role !== 'Admin') {
      alert('Only admins can create offers');
      return;
    }

    await axios.post(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/offers`, {
      ...form,
      status: "Pending"
    }, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    setForm({ application_id: "", position: "", ctc: "", joining_date: "" });
    fetchData();
  };

  return (
    <div>
      <div className="px-8 mt-10 pb-8">
        <h1 className="text-2xl font-bold mb-6 text-[#020839] dark:text-slate-100">Offer Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Offer */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 dark:border-none dark:bg-slate-900">
              <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-slate-100">Generate Offer</h2>
              {user && user.role === 'Admin' ? (
                <form onSubmit={createOffer} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 dark:text-slate-100">Select Candidate</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                      value={form.application_id}
                      onChange={e => setForm({ ...form, application_id: e.target.value })}
                      required
                    >
                      <option value="">-- Only Selected Candidates --</option>
                      {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 dark:text-slate-100">Position / Title</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                      value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 dark:text-slate-100">Annual CTC</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                      placeholder="e.g. 12 LPA"
                      value={form.ctc} onChange={e => setForm({ ...form, ctc: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 dark:text-slate-100">Joining Date</label>
                    <input type="date" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                      value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} required />
                  </div>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow-sm transition">Generate & Send Offer</button>
                </form>
              ) : (
                <div className="text-gray-600 dark:text-slate-100">Only Admins can create offers. You can view offers below.</div>
              )}
            </div>
          </div>

          {/* Offer List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-none overflow-hidden">
              <table className="w-full dark:bg-slate-900">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-600">
                  <tr>
                    <th className="p-3 text-left dark:text-slate-100">Candidate ID</th>
                    <th className="p-3 text-left dark:text-slate-100">Position</th>
                    <th className="p-3 text-left dark:text-slate-100">CTC</th>
                    <th className="p-3 text-left dark:text-slate-100">Joining</th>
                    <th className="p-3 text-left dark:text-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3 font-medium">#{offer.application_id}</td>
                      <td className="p-3">{offer.position}</td>
                      <td className="p-3">{offer.ctc}</td>
                      <td className="p-3">{offer.joining_date}</td>
                      <td className="p-3"><span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold dark:text-slate-100">Pending</span></td>
                    </tr>
                  ))}
                  {offers.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-gray-400 dark:text-slate-100">No offers released yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
