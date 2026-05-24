import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfilePage from './ProfilePage';

const ProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch user');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error('ProfileView error', err);
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/tasks?assignedTo=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setTasks(json.data || []);
        }
      } catch (err) {
        console.warn('Failed to fetch tasks for profile view', err);
      }
    };

    fetchUser();
    fetchTasks();

    const refresh = () => { fetchTasks(); };
    window.addEventListener('tasks-updated', refresh);
    return () => window.removeEventListener('tasks-updated', refresh);
  }, [id, navigate]);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="bg-white min-h-screen">
      <ProfilePage userOverride={user} tasksOverride={tasks} />
    </div>
  );
};

export default ProfileView;
