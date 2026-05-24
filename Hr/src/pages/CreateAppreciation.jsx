import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, createAppreciation } from '../services/appreciationService';

const CreateAppreciation = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ recipient_id: '', title: '', category: '', message: '', emoji: '🎉', points: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        if (res && res.data) setUsers(res.data);
        else if (Array.isArray(res)) setUsers(res);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipient_id || !form.title || !form.category || !form.message) {
      alert('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await createAppreciation(form);
      alert('Appreciation created');
      navigate('/feed');
    } catch (err) {
      console.error('Create appreciation failed', err);
      alert('Failed to create appreciation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-[#0C1014] min-h-screen">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Appreciation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient</label>
            <select name="recipient_id" value={form.recipient_id} onChange={handleChange} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <option value="">Select recipient</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullname} ({u.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <input name="category" value={form.category} onChange={handleChange} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={5} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emoji</label>
              <input name="emoji" value={form.emoji} onChange={handleChange} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Points</label>
              <input type="number" name="points" value={form.points} onChange={handleChange} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="bg-[#266ECD] text-white px-4 py-2 rounded-lg font-semibold">{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAppreciation;
