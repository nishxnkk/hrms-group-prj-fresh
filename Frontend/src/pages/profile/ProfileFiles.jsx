import React, { useState } from 'react';
import { ArrowLeft, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const initialFiles = [
  { id: 'f1', name: 'employment_contract.pdf', size: '240KB' },
  { id: 'f2', name: 'policy_handbook.pdf', size: '512KB' },
];

const ProfileFiles = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState(initialFiles);

  const remove = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const download = (f) => alert(`Pretend downloading ${f.name}`);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">Files & Documents</h1>
      </div>

      <div className="bg-white dark:text-gray-100 dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 p-6">
        {files.map(f => (
          <div key={f.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="text-sm text-gray-500">{f.size}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => download(f)} className="p-2 hover:bg-gray-50 rounded-md"><Download /></button>
              <button onClick={() => remove(f.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-md"><Trash2 /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileFiles;
