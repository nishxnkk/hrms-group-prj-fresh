import React, { useEffect, useState } from 'react';
import { getTasks } from '../../services/taskService.js';

const ProfileTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getTasks();
        if (!mounted) return;
        setTasks(res.data || []);
      } catch (err) {
        setError(err?.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Tasks</h2>
      {loading && <div className="p-4"> <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" /> Loading tasks...</div>}
      {error && <div className="p-4 text-red-600">{error}</div>}

      <div className="space-y-6">
        {tasks.length === 0 && !loading && <div className="text-gray-600">No tasks assigned</div>}

        {(() => {
          const now = new Date();
          const due = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) <= now);
          const inProgress = tasks.filter(t => t.status !== 'completed' && (!t.due_date || new Date(t.due_date) > now));
          const completed = tasks.filter(t => t.status === 'completed');

          return (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-2">Due ({due.length})</h4>
                {due.length === 0 ? <div className="text-gray-500 mb-3">No due tasks</div> : (
                  <div className="space-y-2 mb-4">
                    {due.map(t => (
                      <div key={t.id} className="p-3 bg-red-50 rounded flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{t.title}</div>
                          <div className="text-xs text-gray-500">Assigned by: {t.created_by_name || '—'}</div>
                          <div className="text-xs text-gray-500">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={async () => { try { const { updateTask } = await import('../../services/taskService.js'); await updateTask(t.id, { status: 'completed', percent_completed: 100 }); window.dispatchEvent(new Event('tasks-updated')); setTasks(prev => prev.map(p => p.id === t.id ? { ...p, status: 'completed', percent_completed: 100 } : p)); } catch (err) { console.error(err); } }} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Mark complete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">In Progress / Pending ({inProgress.length})</h4>
                {inProgress.length === 0 ? <div className="text-gray-500 mb-3">No pending or in-progress tasks</div> : (
                  <div className="space-y-2 mb-4">
                    {inProgress.map(t => (
                      <div key={t.id} className="p-3 bg-yellow-50 rounded flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{t.title}</div>
                          <div className="text-xs text-gray-500">Assigned by: {t.created_by_name || '—'}</div>
                          <div className="text-xs text-gray-500">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={async () => { try { const { updateTask } = await import('../../services/taskService.js'); await updateTask(t.id, { status: 'completed', percent_completed: 100 }); window.dispatchEvent(new Event('tasks-updated')); setTasks(prev => prev.map(p => p.id === t.id ? { ...p, status: 'completed', percent_completed: 100 } : p)); } catch (err) { console.error(err); } }} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Mark complete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Completed ({completed.length})</h4>
                {completed.length === 0 ? <div className="text-gray-500 mb-3">No completed tasks</div> : (
                  <div className="space-y-2">
                    {completed.map(t => (
                      <div key={t.id} className="p-3 bg-green-50 rounded flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{t.title}</div>
                          <div className="text-xs text-gray-500">Assigned by: {t.created_by_name || '—'}</div>
                          <div className="text-xs text-gray-500">Completed: {t.certified_at ? new Date(t.certified_at).toLocaleString() : (t.updated_at ? new Date(t.updated_at).toLocaleString() : '—')}</div>
                          {t.certified_by_name && <div className="text-xs text-gray-500">Certified by: {t.certified_by_name}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm font-semibold">{t.percent_completed ? `${t.percent_completed}%` : '—'}</div>
                          <div className={`text-xs px-2 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</div>
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
  );
};

export default ProfileTasks;
