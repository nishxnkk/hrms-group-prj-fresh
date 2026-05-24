import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ArchivedUsers() {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/archived`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          setArchived(json.archived || []);
        } else if (res.status === 403) {
          alert('Access denied');
          navigate('/');
        }
      } catch (err) {
        console.error('Failed to fetch archived users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Archived Users</h1>
          <p className="text-sm text-gray-500">List of resigned/archived users</p>
        </div>
        <div>
          <button onClick={() => navigate('/employees')} className="px-3 py-2 bg-gray-100 rounded">Back to Employees</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        {loading ? <div className="text-gray-500">Loading...</div> : (
          archived.length === 0 ? (
            <div className="text-gray-500">No archived users found</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Resigned At</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">Archived At</th>
                </tr>
              </thead>
              <tbody>
                {archived.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2 px-3">{a.data?.user?.fullname || a.data?.fullname || a.data?.name || '—'}</td>
                    <td className="py-2 px-3">{a.data?.user?.email || a.data?.email || '—'}</td>
                    <td className="py-2 px-3">{a.resigned_at ? new Date(a.resigned_at).toLocaleString() : '—'}</td>
                    <td className="py-2 px-3">{a.resignation_reason || '—'}</td>
                    <td className="py-2 px-3">{a.archived_at ? new Date(a.archived_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}