import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileReferrals = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([{ name: 'Rahul Kumar', email: 'rahul@example.com' }]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const add = () => {
    if (!name || !email) return;
    setList(prev => [...prev, { name, email }]);
    setName(''); setEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">My Referrals</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 p-6">
        <div className="space-y-3">
          <div>
            {list.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium dark:text-gray-100">{r.name}</div>
                  <div className="text-sm dark:text-gray-100">{r.email}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <h4 className="font-medium">Refer someone</h4>
            <div className="mt-2 flex gap-2">
              <input value={name} onChange={(e)=>setName(e.target.value)} className="border px-3 py-2 rounded-md" placeholder="Name" />
              <input value={email} onChange={(e)=>setEmail(e.target.value)} className="border px-3 py-2 rounded-md" placeholder="Email" />
              <button onClick={add} className="px-4 py-2 bg-blue-600 text-white rounded-md">Refer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileReferrals;
