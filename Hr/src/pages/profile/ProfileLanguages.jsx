import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileLanguages = () => {
  const navigate = useNavigate();
  const [langs, setLangs] = useState(['English', 'Hindi']);
  const [input, setInput] = useState('');

  const add = () => {
    if (!input) return;
    setLangs(prev => [...prev, input]);
    setInput('');
  };

  const remove = (i) => setLangs(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">Languages</h1>
      </div>

      <div className="bg-white dark:text-gray-900 dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex gap-2 flex-wrap">
          {langs.map((l, i) => (
            <div key={i} className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">{l} <button onClick={() => remove(i)} className="text-sm text-red-500">x</button></div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Add language" className="border px-3 py-2 dark:text-gray-100 rounded-md flex-1" />
          <button onClick={add} className="px-4 py-2 bg-[#2C50AB] hover:bg-[#3b62c7] text-white rounded-md">Add</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileLanguages;
