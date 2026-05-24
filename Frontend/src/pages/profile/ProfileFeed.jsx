import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileFeed = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = React.useState([]);
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const fetchActivities = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) return;
    try {
      const res = await fetch(`${base}/api/activities/likes/${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    }
  };

  React.useEffect(() => { fetchActivities(); const handler = () => fetchActivities(); window.addEventListener('activity:updated', handler); return () => window.removeEventListener('activity:updated', handler); }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">Latest Feed</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 p-6">
        {activities.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-100">No recent activity.</p>
        ) : (
          activities.map(item => (
            <div key={item.id} className="border-b last:border-b-0 py-3">
              <p className="text-gray-800">You liked "{item.title}" by {item.recipient_name}</p>
              <div className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfileFeed;
