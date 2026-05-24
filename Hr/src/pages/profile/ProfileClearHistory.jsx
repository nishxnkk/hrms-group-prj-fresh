import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileClearHistory = () => {
  const navigate = useNavigate();
  const [cleared, setCleared] = useState(false);

  const clear = () => {
    localStorage.removeItem('history');
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">Clear History</h1>
      </div>

      <div className="bg-white dark:text-gray-100 dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 p-6">
        <p className="dark:text-gray-100 mb-4">This will clear your local history (locally stored items only).</p>
        <div className="flex gap-3">
          <button className="px-4 flex py-2 bg-red-600 text-white rounded-md" onClick={clear}><Trash2 /> Clear</button>
          {cleared && <div className="text-sm text-green-600">History cleared.</div>}
        </div>
      </div>
    </div>
  );
};

export default ProfileClearHistory;
