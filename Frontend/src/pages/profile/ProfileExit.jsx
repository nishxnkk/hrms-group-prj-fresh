import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileExit = () => {
  const navigate = useNavigate();

  const exit = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-100">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-semibold">Exit</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <p className="text-gray-700 mb-4">Are you sure you want to exit? This will sign you out of the app on this device.</p>
        <div className="flex gap-3">
          <button onClick={exit} className="px-4 py-2 bg-red-600 text-white rounded-md">Sign out</button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-md">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileExit;
