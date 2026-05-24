import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Redemption = () => {
  const navigate = useNavigate();

  const goBack = () => {
    // If there is a history entry, go back; otherwise fallback to /feed
    if (window.history.length > 1) navigate(-1);
    else navigate('/feed');
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      if (user && user.id) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${base}/api/users/${user.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
          if (res.ok) {
            const data = await res.json();
            const u = data.user || {};
            document.getElementById('user-points').textContent = u.points || 0;
            // Update local storage copy
            localStorage.setItem('user', JSON.stringify(u));
          } else {
            document.getElementById('user-points').textContent = '0';
          }
        } catch (err) {
          console.error('Failed to fetch user points', err);
        }
      } else {
        document.getElementById('user-points').textContent = '0';
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Redemption Center</h1>
          <p className="text-gray-600 mb-4">Browse rewards and redeem your points here.</p>

          {/* User points and simple redemption UI */}
          <div className="mb-6">
            <div className="text-sm text-gray-600">Your points</div>
            <div id="user-points" className="text-3xl font-bold text-gray-900">Loading...</div>
          </div>

          <div className="border border-dashed border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 mb-4">Redeem your points for rewards. (Placeholder catalog)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-lg font-semibold">Coffee Voucher</div>
                <div className="text-sm text-gray-500 mt-1">Cost: 100 pts</div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md">Redeem</button>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-lg font-semibold">Lunch Voucher</div>
                <div className="text-sm text-gray-500 mt-1">Cost: 300 pts</div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md">Redeem</button>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4">(Redemption flow is a placeholder — I can implement server-side redeem later)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Redemption;
