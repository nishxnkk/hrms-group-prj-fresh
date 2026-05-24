import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../../services/appreciationService.js';
import { createTask, getTasks, deleteTask, updateTask } from '../../services/taskService.js';
import { focusFirstInvalid, handleInvalidCapture } from '../../utils/formValidation.js';

const TasksAdmin = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', due_date: '' });
  const [q, setQ] = useState('');

  // Handle authentication related errors (token expired / invalid)
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const formRef = useRef(null);

  const handleAuthError = (err) => {
    const msg = (err && (err.message || err.error || err)) || '';
    const text = typeof msg === 'string' ? msg : (msg.message || JSON.stringify(msg));

    if (/token expired|expired/i.test(text) || /invalid or expired token/i.test(text) || (err && err.status === 401)) {
      // clear local auth and prompt user to re-login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAdmin(false);
      setUsers([]);
      setTasks([]);
      setError('Session expired. Please login again.');
      return true;
    }

    return false;
  };

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await getAllUsers();
      setUsers(res.users || res.data?.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
      if (!handleAuthError(err)) {
        setUsers([]);
        setError(err?.message || JSON.stringify(err));
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadTasks = async () => {
    try {
      setError(null);
      setIsLoadingTasks(true);
      const res = await getTasks();
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks', err);
      if (!handleAuthError(err)) {
        const msg = (err && err.message) || err;
        setError(msg?.error || msg || 'Failed to load tasks');
      }
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
    loadTasks();

    // check local user role and token
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      setIsAdmin(!!(u && u.role === 'Admin'));
    } catch (e) {
      setIsAdmin(false);
    }

    const token = localStorage.getItem('token');
    if (!token) setError('Not authenticated. Please login to access admin features.');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert('Only admins can create tasks');
    if (focusFirstInvalid(formRef.current)) {
      setError('Title is required');
      return;
    }
    try {
      await createTask(form);
      setForm({ title: '', description: '', assigned_to: '', due_date: '' });
      await loadTasks();
      // notify sidebar and other parts
      window.dispatchEvent(new Event('tasks-updated'));
    } catch (err) {
      console.error('Create task failed', err);
      if (handleAuthError(err)) {
        alert('Session expired. Please login again.');
        return;
      }
      const msg = (err && (err.message || err.error)) || err || 'Failed to create task';
      alert(msg.error || msg);
    }
  };

  const filtered = tasks.filter(t => t.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin: Tasks</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Create Task</h3>

          {!isAdmin ? (
            <div className="p-4 bg-red-50 text-red-600 rounded">Only Admins can create tasks. Your account does not have permissions to perform this action.</div>
          ) : (
            <form ref={formRef} onInvalidCapture={handleInvalidCapture} onSubmit={submit} className="space-y-2">
              <input required disabled={isLoadingUsers || !isAdmin} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded" placeholder="Title" />
              <textarea disabled={isLoadingUsers || !isAdmin} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-2 border rounded" placeholder="Description" />
              <select disabled={isLoadingUsers || !isAdmin} value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full p-2 border rounded">
                <option value="">Assign to</option>
                {isLoadingUsers ? (
                  <option value="">Loading users...</option>
                ) : users.length === 0 ? (
                  <option value="">No users available</option>
                ) : (
                  users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullname} ({u.email})</option>
                  ))
                )}
              </select>
              <input disabled={isLoadingUsers || !isAdmin} type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full p-2 border rounded" />
              <button disabled={isLoadingUsers || !isAdmin} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                {isLoadingUsers ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" /> : null}
                Create
              </button>
            </form>
          )}
        </div>

        <div className="col-span-2 bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Tasks</h3>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="p-2 border rounded" />
          </div>

          {error && (
            <div className="mb-3 p-3 bg-yellow-50 text-yellow-800 rounded flex items-center justify-between">
              <div>{error}</div>
              {error.includes('login') && (
                <button onClick={() => navigate('/login')} className="text-sm px-3 py-1 bg-blue-600 text-white rounded">Go to Login</button>
              )}
            </div>
          )}

          <div className="space-y-6">
            {/* Group tasks: Due (overdue & not completed), In Progress / Pending, Completed */}
            {filtered.length === 0 && <div className="text-gray-600">No tasks</div>}

            {(() => {
              const now = new Date();
              const due = filtered.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) <= now);
              const inProgress = filtered.filter(t => t.status !== 'completed' && (!t.due_date || new Date(t.due_date) > now));
              const completed = filtered.filter(t => t.status === 'completed');

              return (
                <>
                  {/* DUE */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Due ({due.length})</h4>
                    {due.length === 0 ? <div className="text-gray-500 mb-3">No due tasks</div> : (
                      <div className="space-y-2 mb-4">
                        {due.map(task => (
                          <div className="p-3 bg-red-50 rounded flex justify-between items-center" key={task.id}>
                            <div>
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-gray-500">Assigned: {task.assigned_to_name || '—'}</div>
                              <div className="text-sm text-gray-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={async () => { try { await updateTask(task.id, { status: 'completed', percent_completed: 100 }); await loadTasks(); window.dispatchEvent(new Event('tasks-updated')); } catch (err) { if (handleAuthError(err)) { alert('Session expired. Please login again.'); return; } if (err && err.message) { alert(err.message); } else { alert('Failed to update task'); } } }} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Certify & Mark done</button>
                              <button onClick={async () => { if (!confirm('Delete task?')) return; try { await deleteTask(task.id); await loadTasks(); window.dispatchEvent(new Event('tasks-updated')); } catch (err) { if (handleAuthError(err)) { alert('Session expired. Please login again.'); return; } if (err && err.message) { alert(err.message); } else { alert('Failed to delete task'); } } }} className="px-3 py-1 rounded bg-red-100 text-red-600 text-sm">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* IN PROGRESS */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">In Progress / Pending ({inProgress.length})</h4>
                    {inProgress.length === 0 ? <div className="text-gray-500 mb-3">No pending or in-progress tasks</div> : (
                      <div className="space-y-2 mb-4">
                        {inProgress.map(task => (
                          <div className="p-3 bg-yellow-50 rounded flex justify-between items-center" key={task.id}>
                            <div>
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-gray-500">Assigned: {task.assigned_to_name || '—'}</div>
                              <div className="text-sm text-gray-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={async () => { try { await updateTask(task.id, { status: 'completed', percent_completed: 100 }); await loadTasks(); window.dispatchEvent(new Event('tasks-updated')); } catch (err) { if (handleAuthError(err)) { alert('Session expired. Please login again.'); return; } if (err && err.message) { alert(err.message); } else { alert('Failed to update task'); } } }} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Certify & Mark done</button>
                              <button onClick={async () => { if (!confirm('Delete task?')) return; try { await deleteTask(task.id); await loadTasks(); window.dispatchEvent(new Event('tasks-updated')); } catch (err) { if (handleAuthError(err)) { alert('Session expired. Please login again.'); return; } if (err && err.message) { alert(err.message); } else { alert('Failed to delete task'); } } }} className="px-3 py-1 rounded bg-red-100 text-red-600 text-sm">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COMPLETED */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Completed ({completed.length})</h4>
                    {completed.length === 0 ? <div className="text-gray-500 mb-3">No completed tasks</div> : (
                      <div className="space-y-2">
                        {completed.map(task => (
                          <div className="p-3 bg-green-50 rounded flex justify-between items-center" key={task.id}>
                            <div>
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-gray-500">Assigned: {task.assigned_to_name || '—'}</div>
                              <div className="text-sm text-gray-500">Completed: {task.certified_at ? new Date(task.certified_at).toLocaleString() : (task.updated_at ? new Date(task.updated_at).toLocaleString() : '—')}</div>
                              {task.certified_by_name && <div className="text-sm text-gray-500">Certified by: {task.certified_by_name}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={async () => { if (!confirm('Re-open this task?')) return; try { await updateTask(task.id, { status: 'in_progress', percent_completed: 0, certified_by: null, certified_at: null }); await loadTasks(); window.dispatchEvent(new Event('tasks-updated')); } catch (err) { if (handleAuthError(err)) { alert('Session expired. Please login again.'); return; } if (err && err.message) { alert(err.message); } else { alert('Failed to update task'); } } }} className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 text-sm">Re-open</button>
                              <button onClick={async () => { if (!confirm('Delete task?')) return; try { await deleteTask(task.id); await loadTasks(); window.dispatchEvent(new Event('tasks-updated')); } catch (err) { if (handleAuthError(err)) { alert('Session expired. Please login again.'); return; } if (err && err.message) { alert(err.message); } else { alert('Failed to delete task'); } } }} className="px-3 py-1 rounded bg-red-100 text-red-600 text-sm">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksAdmin;
