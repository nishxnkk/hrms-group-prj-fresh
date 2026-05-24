import React, { useState } from 'react';
import { ArrowLeft, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileUploads = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const fetchFiles = async () => {
    const res = await fetch(`${base}/api/uploads`);
    const data = await res.json();
    setFiles(data);
  };

  React.useEffect(() => { fetchFiles(); }, []);

  const onChange = (e) => setSelected(e.target.files[0]);

  const upload = async () => {
    if (!selected) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', selected);
    const res = await fetch(`${base}/api/uploads`, { method: 'POST', body: fd });
    if (res.ok) {
      setSelected(null);
      await fetchFiles();
    }
    setUploading(false);
  };

  const remove = async (filename) => {
    const res = await fetch(`${base}/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
    if (res.ok) await fetchFiles();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6 mt-5">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-300 hover:dark:bg-gray-900">
          <ArrowLeft className='dark:text-gray-100' />
        </button>
        <h1 className="text-2xl dark:text-gray-100 font-semibold">My Uploads</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex gap-2 items-center mb-4">
          <input type="file" onChange={onChange} />
          <button onClick={upload} disabled={!selected || uploading} className="px-4 py-2 bg-[#2C50AB] hover:bg-[#3b62c7] text-white rounded-md">{uploading ? 'Uploading...' : 'Upload'}</button>
        </div>

        {files.length === 0 ? (
          <p className="text-gray-600">No files uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {files.map(f => (
              <div key={f.filename} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.filename}</div>
                  <div className="text-sm text-gray-500">{Math.round(f.size/1024)} KB</div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`${base}/assets/uploads/${encodeURIComponent(f.filename)}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-100 rounded-md"><Download /></a>
                  <button className="p-2 hover:bg-red-50 text-red-600 rounded-md" onClick={() => remove(f.filename)}><Trash2 /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileUploads;
