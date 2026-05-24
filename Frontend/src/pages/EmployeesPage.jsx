import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Trash2, Edit2, MoreVertical, Mail, Phone, Filter, Download } from 'lucide-react';
import AddEmployeeModal from '../components/Employee/AddEmployeeModal';
import { useNavigate } from 'react-router-dom';

function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const filterRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get Current User Logic
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    // Refresh users (and points) when activity updates (e.g., points transfers)
    const onActivity = () => fetchUsers();
    window.addEventListener('activity:updated', onActivity);

    // Refresh when tasks change so we can update task counts in the list
    const onTasksUpdated = () => fetchUsers();
    window.addEventListener('tasks-updated', onTasksUpdated);

    // Presence updates from socket are re-emitted as DOM events
    const onPresence = (e) => {
      const d = e.detail;
      setUsers(prev => prev.map(u => {
        if (String(u.id) !== String(d.userId)) return u;
        const currRaw = (u.raw_status || u.status || '').toString().trim().toUpperCase();
        // Do not let live presence overwrite a manually set inactive/resigned status.
        if ((currRaw === 'INACTIVE' || currRaw === 'RESIGNED') && d.status !== currRaw) {
          return { ...u, last_activity: d.last_activity || u.last_activity };
        }
        return { ...u, status: d.status, last_activity: d.last_activity };
      }));
    };
    // Attach presence listener before the initial fetch so any immediate presence updates during fetch are handled
    window.addEventListener('presence:update', onPresence);

    // Fetch user list after we are listening for presence updates to avoid missing quick presence events
    fetchUsers();

    return () => {
      window.removeEventListener('activity:updated', onActivity);
      window.removeEventListener('tasks-updated', onTasksUpdated);
      window.removeEventListener('presence:update', onPresence);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const usersList = data.users || data;
        // fetch tasks summary and merge
        try {
          const sres = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/tasks/summary`, { headers: { Authorization: `Bearer ${token}` } });
          if (sres.ok) {
            const sjson = await sres.json();
            const arr = sjson.data || [];
            const map = {};
            arr.forEach(r => { if (r.user_id) map[r.user_id] = r; });
            const merged = usersList.map(u => ({ ...u, taskSummary: map[u.id] || { total: 0, completed: 0, overdue: 0 } }));
            setUsers(merged);
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch tasks summary', err);
        }
        // Optimistically mark the current client as ACTIVE locally so they don't briefly appear inactive on refresh
        try {
          const selfStr = localStorage.getItem('user');
          if (selfStr) {
            const self = JSON.parse(selfStr);
            const updated = usersList.map(u => {
              if (String(u.id) !== String(self.id)) return u;
              const curr = (u.status || '').toString().trim().toUpperCase();
              // don't overwrite a resigned status
              if (curr === 'RESIGNED') return u;
              return { ...u, status: 'ACTIVE' };
            });
            setUsers(updated);
          } else {
            setUsers(usersList);
          }
        } catch (e) {
          setUsers(usersList);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAdded = (newUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleDelete = async (id) => {
    if (!(await window.uiConfirm?.("Are you sure you want to delete this employee? This action cannot be undone."))) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        window.uiAlert?.("Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      window.uiAlert?.("Error deleting user");
    }
  };

  // Toggle a user's status (Admin only)
  const handleToggleStatus = async (id, currentStatus) => {
    if (!isAdmin) return;
    const normalizedStatus = (currentStatus || '').toString().trim().toUpperCase();
    const newStatus = (normalizedStatus === 'ACTIVE' || normalizedStatus === 'IDLE') ? 'INACTIVE' : 'ACTIVE';
    if (!(await window.uiConfirm?.(`Set user #${id} status to ${newStatus}?`))) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.user;
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated, raw_status: updated.status } : u));
      } else {
        const err = await res.json().catch(() => null);
        window.uiAlert?.(err?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      window.uiAlert?.('Error updating status');
    }
  };

  // Admin: mark a user as resigned (archive & delete)
  const handleMarkResigned = async (id) => {
    if (!isAdmin) return;
    if (!(await window.uiConfirm?.(`Mark user #${id} as Resigned and archive their data?`))) return;

    try {
      const reason = await window.uiPrompt?.('Reason for resignation (optional):');
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Resigned', resignation_reason: reason })
      });

      if (res.ok) {
        // user removed from DB; remove locally
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const err = await res.json().catch(() => null);
        window.uiAlert?.(err?.message || 'Failed to mark resigned');
      }
    } catch (err) {
      console.error('Failed to mark resigned', err);
      window.uiAlert?.('Error marking resigned');
    }
  };

  // Admin: Reinstate a resigned user
  const handleReinstate = async (id) => {
    if (!isAdmin) return;
    if (!(await window.uiConfirm?.(`Reinstate user #${id} to Active status?`))) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'ACTIVE' })
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.user;
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated, raw_status: updated.status } : u));
      } else {
        const err = await res.json().catch(() => null);
        window.uiAlert?.(err?.message || 'Failed to reinstate');
      }
    } catch (err) {
      console.error('Failed to reinstate', err);
      window.uiAlert?.('Error reinstating user');
    }
  };

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort();
  const statuses = Array.from(new Set(users.map(u => (u.status || u.employee_status || '').toString().trim().toUpperCase()).filter(Boolean))).filter(Boolean);

  let filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (u.fullname || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (selectedStatus) {
      const s = (u.status || u.employee_status || '').toString().trim().toUpperCase();
      if (s !== selectedStatus) return false;
    }

    if (selectedDepartment) {
      if ((u.department || '') !== selectedDepartment) return false;
    }

    return true;
  });

  const exportToCSV = (rows) => {
    if (!rows || rows.length === 0) {
      window.uiAlert?.('No data to export');
      return;
    }

    const headers = ['ID','Fullname','Email','Designation','Department','Status','Points','Joined'];

    // Better CSV building to handle quotes & all fields
    const formatDateISO = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d)) return '';
      return d.toISOString().slice(0,10); // YYYY-MM-DD
    };

    const buildRow = (u) => {
      const vals = [
        u.id,
        (u.fullname||'').replace(/"/g,'""'),
        (u.email||'').replace(/"/g,'""'),
        (u.designation||'').replace(/"/g,'""'),
        (u.department||'').replace(/"/g,'""'),
        ((u.status||u.employee_status)||'').toString().replace(/"/g,'""'),
        u.points||0,
        formatDateISO(u.date_of_joining) || formatDateISO(u.created_at)
      ];
      return '"' + vals.join('","') + '"';
    };

    const csvBody = [headers.join(','), ...rows.map(buildRow)].join('\n');
    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Close filter dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="flex bg-[#f9fafb] dark:bg-slate-800 min-h-screen relative font-inter">
      <div className="w-full transition-all duration-300">

        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-slate-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">HRMS</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-slate-400">
            <i className="fas fa-bars text-2xl"></i>
          </button>
        </div>

        <div className="p-6 sm:p-10 max-w-[1600px] mx-auto">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <nav className="flex mb-2" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <span className="text-sm font-medium text-gray-500  dark:text-slate-400">Employee Management</span>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="mx-2 text-gray-400 dark:text-slate-400">/</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">Employees</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Employees Directory</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage and view all employee profiles</p>
            </div>

            <div className="flex gap-3">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all transform hover:-translate-y-0.5"
                  >
                    <Plus size={18} />
                    Add Employee
                  </button>

                  <button onClick={() => navigate('/archived-users')} className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2.5 rounded-xl font-medium border border-orange-100 transition-all">Archived</button>
                </>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">

            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-100 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none dark:text-slate-100"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-2 w-full md:w-auto items-center relative" ref={filterRef}>
              <div className="relative">
                <button onClick={() => setFilterOpen(v => !v)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white">
                  <Filter size={16} />
                  Filter
                </button>

                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="mb-3">
                      <label className="text-xs text-gray-500">Status</label>
                      <select value={selectedStatus} onChange={(e)=>setSelectedStatus(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm">
                        <option value="">All</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="text-xs text-gray-500">Department</label>
                      <select value={selectedDepartment} onChange={(e)=>setSelectedDepartment(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm">
                        <option value="">All</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedStatus(''); setSelectedDepartment(''); setFilterOpen(false); }} className="px-3 py-1 text-sm border rounded">Clear</button>
                      <button onClick={() => setFilterOpen(false)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => exportToCSV(filteredUsers)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-700 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold dark:text-slate-100">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Role & Dept</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Points</th>
                    <th className="px-6 py-4">Status / Tasks</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading directory...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500 dark:text-slate-400">No employees found.</td></tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const rawStatus = user.status || user.employee_status || user.status_of_employee || user.status_of_employment || '';
                      const status = (rawStatus || '').toString().trim().toUpperCase();
                      const statusLabel = status || 'UNKNOWN';
                      return (
                        <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={user.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${user.profile_picture}`) : "/pexels-olly-927022.jpg"}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                              />
                              <div>
                                <div className="font-bold text-gray-900 dark:text-slate-100">{user.fullname}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{user.employee_id || `#EMP-${user.id}`}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800 dark:text-slate-100">{user.designation || "N/A"}</div>
                            <div className="text-xs text-gray-500">{user.department || "General"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 dark:text-slate-400">
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                <Mail size={12} className="text-gray-400" />
                                {user.email}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                <Phone size={12} className="text-gray-400" />
                                {user.phone || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-slate-100">
                            {user.points || 0}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' :
                                status === 'INACTIVE' ? 'bg-red-50 text-red-700 border border-red-100' : status === 'IDLE' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : status === 'RESIGNED' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-100 text-gray-700'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'ACTIVE' ? 'bg-green-500' : status === 'INACTIVE' ? 'bg-red-500' : status === 'IDLE' ? 'bg-yellow-500' : status === 'RESIGNED' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                                {statusLabel}
                              </span>
                              {isAdmin && (
                                <>
                                  {status === 'RESIGNED' ? (
                                    <button onClick={() => handleReinstate(user.id)} className="ml-2 text-xs px-2 py-0.5 rounded bg-green-50 border text-green-600 hover:bg-green-100">Reinstate</button>
                                  ) : (
                                    <>
                                      <button onClick={() => handleToggleStatus(user.id, status)} className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-50 border text-gray-600 hover:bg-gray-100">{(status === 'ACTIVE' || status === 'IDLE') ? 'Set Inactive' : 'Set Active'}</button>
                                      <button onClick={() => handleMarkResigned(user.id)} className="ml-2 text-xs px-2 py-0.5 rounded bg-red-50 border text-red-600 hover:bg-red-100">Mark Resigned</button>
                                    </>
                                  )}
                                </>
                              )}
                              {user.taskSummary && (
                                (user.taskSummary.total || 0) > 0 ? (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                      <strong className="text-sm">{user.taskSummary.total || 0}</strong>
                                      <span className="hidden sm:inline">tasks</span>
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">
                                      <strong className="text-sm">{user.taskSummary.completed || 0}</strong>
                                      <span className="hidden sm:inline">done</span>
                                    </span>
                                    {user.taskSummary.overdue > 0 && (
                                      <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700">
                                        <strong className="text-sm">{user.taskSummary.overdue}</strong>
                                        <span className="hidden sm:inline">overdue</span>
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 mt-2">No open tasks</div>
                                )
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                            {user.date_of_joining ? new Date(user.date_of_joining).toLocaleDateString() : (user.created_at ? new Date(user.created_at).toLocaleDateString() : '-')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate(`/profile/${user.id}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                                <MoreVertical size={16} />
                              </button>
                              {/* Admin Actions */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Static for now) */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 dark:bg-slate-700 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-slate-100">Showing {filteredUsers.length} employees</span>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-not-allowed">Previous</button>
                <button disabled className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  )
}

export default EmployeesPage;
