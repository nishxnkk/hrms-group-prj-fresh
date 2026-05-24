import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileLocation = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('Bengaluru');
  const [country, setCountry] = useState('India');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
      setSaved(false);
      alert('No user found locally. Please sign in.');
      return;
    }

    try {
      const res = await fetch(`${base}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_city: city, location_country: country })
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      // update local user
      localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Could not save location');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">Location</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 p-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm dark:text-gray-100">City</label>
            <input value={city} onChange={e => setCity(e.target.value)} className="border px-3 py-2 rounded-md w-full" />
          </div>
          <div>
            <label className="block text-sm dark:text-gray-100">Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} className="border px-3 py-2 rounded-md w-full" />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} className="px-4 py-2 bg-[#2C50AB] hover:bg-[#3b62c7] text-white rounded-md">Save</button>
            {saved && <div className="text-sm text-green-600">Saved.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLocation;
