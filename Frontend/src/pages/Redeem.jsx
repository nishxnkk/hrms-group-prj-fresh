import React, { useState } from 'react';
import { Gift, ShoppingCart, History, Coffee, Ticket, Heart, Home, Laptop, Calendar, Award, ExternalLink, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RedemptionPage = () => {
  const [availablePoints, setAvailablePoints] = React.useState(0);
  const [rewards, setRewards] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Derived quick-stats from redemption history
  const totalRedeemed = React.useMemo(() => {
    return history.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [history]);

  const savingsValue = React.useMemo(() => {
    // Convert points to dollar-equivalent assuming 100 pts = $1
    return totalRedeemed / 100;
  }, [totalRedeemed]);

  const avgMonthly = React.useMemo(() => {
    if (!history || history.length === 0) return 0;
    // compute number of months covered by history (inclusive)
    const dates = history.map(h => new Date(h.created_at)).filter(d => !isNaN(d));
    if (dates.length === 0) return 0;
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const months = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
    return Math.round(totalRedeemed / Math.max(1, months));
  }, [history, totalRedeemed]);

  const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      // Fetch items
      const itemsRes = await fetch(`${base}/api/redeem/items`);
      const itemsJson = await itemsRes.json();
      setRewards(itemsJson.items || []);

      // Fetch user points
      if (user && user.id) {
        const ures = await fetch(`${base}/api/users/${user.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        if (ures.ok) {
          const udata = await ures.json();
          const u = udata.user || {};
          setAvailablePoints(u.points || 0);
          // persist local copy
          localStorage.setItem('user', JSON.stringify(u));
        }

        // Fetch user history
        const hres = await fetch(`${base}/api/redeem/user/${user.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        if (hres.ok) {
          const hjson = await hres.json();
          setHistory(hjson.history || []);
        }
      }
    } catch (err) {
      console.error('Failed to load redemption data', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (item) => {
    if (!confirm(`Redeem ${item.title} for ${item.cost.toLocaleString()} pts?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/api/redeem/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ item_id: item.id })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to redeem');
        return;
      }

      // update local UI
      setAvailablePoints(data.user?.points || (availablePoints - item.cost));
      // refresh lists
      fetchData();
      // notify other pages
      try { window.dispatchEvent(new CustomEvent('activity:updated')); } catch (e) { }

      alert('Redemption successful!');
    } catch (err) {
      console.error('Redeem failed', err);
      alert('Redeem failed');
    }
  };


  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/feed');
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div>
        <button onClick={goBack} className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 mb-4">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Redemption Center</h1>
        <p className="text-gray-600 dark:text-gray-400">Redeem your points for amazing rewards</p>
      </div>

      {/* Points Display */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-20">
          <Award size={120} />
        </div>
        <p className="text-blue-100 mb-2 text-lg">Available Points Balance</p>
        <h2 className="text-6xl font-bold mb-4">{availablePoints.toLocaleString()}</h2>
        <div className="flex items-center gap-2">
          <div className="w-full bg-blue-500/30 rounded-full h-3">
            <div
              className="bg-linear-to-r from-yellow-400 to-orange-400 h-full rounded-full"
              style={{ width: `${(availablePoints / 20000) * 100}%` }}
            ></div>
          </div>
          <span className="text-blue-100 whitespace-nowrap">
            {((availablePoints / 20000) * 100).toFixed(0)}% to next tier
          </span>
        </div>
      </div>

      {/* Featured Rewards */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Rewards</h2>
            <p className="text-gray-600 dark:text-gray-400">Exchange your points for exclusive rewards</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Filter size={20} className="text-gray-500" />
            <select className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium dark:text-white">
              <option>Soft Points (Low to High)</option>
              <option>Points (High to Low)</option>
              <option>Most Popular</option>
              <option>Recently Added</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">Loading rewards…</div>
          ) : rewards.length === 0 ? (
            <div className="col-span-3 text-center py-12">No rewards available.</div>
          ) : (
            rewards.map((reward) => (
              <div
                key={reward.id}
                className={`bg-linear-to-br ${reward.color || 'from-gray-50 to-gray-100'} dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border-2 ${reward.borderColor || 'border-gray-200'} dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {/* if icon exists use it */}
                    {reward.icon || <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded" />}
                  </div>
                  <span className="bg-linear-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                    {reward.cost?.toLocaleString() || reward.points?.toLocaleString() || 0} pts
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">{reward.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 capitalize">{reward.category || reward.description}</p>

                <button onClick={() => handleRedeem(reward)} disabled={availablePoints < (reward.cost || reward.points || 0)} className={`w-full text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center gap-3 ${availablePoints < (reward.cost || reward.points || 0) ? 'bg-gray-300 cursor-not-allowed text-gray-600' : (
                  reward.category === 'benefits' ? 'bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' :
                    reward.category === 'charity' ? 'bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' :
                      reward.category === 'shopping' ? 'bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                        reward.category === 'entertainment' ? 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                          reward.category === 'dining' ? 'bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800' :
                            'bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                )
                  }`}>
                  <ShoppingCart size={18} />
                  {availablePoints < (reward.cost || reward.points || 0) ? 'Insufficient points' : 'Redeem Now'}
                  <ExternalLink size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Redemption History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <History className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Redemption History</h2>
              <p className="text-gray-600 dark:text-gray-400">Track your past redemptions</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white">Reward</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white">Value</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white">Points</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-800 dark:text-gray-200 font-bold text-sm">{(item.item_title || '').slice(0, 1)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{item.item_title || 'Redeem'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Redemption ID: #{item.id}000{item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white">{item.cost ? `$${(item.cost / 100).toFixed(2)}` : '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-red-600 dark:text-red-400">{(item.cost || 0).toLocaleString()} pts</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {item.status || 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="mt-8 w-full bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-white px-6 py-4 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          View Complete Transaction History
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 dark:text-purple-300 font-medium">Total Redeemed</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalRedeemed.toLocaleString()} pts</h3>
            </div>
            <Gift className="text-purple-600 dark:text-purple-400" size={32} />
          </div>
        </div>
        <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 dark:text-blue-300 font-medium">Avg. Monthly</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{avgMonthly.toLocaleString()} pts</h3>
            </div>
            <Calendar className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
        </div>
        <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">Savings Value</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{savingsValue.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</h3>
            </div>
            <ShoppingCart className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedemptionPage;