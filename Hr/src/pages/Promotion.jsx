import React, { useRef, useState } from 'react';
import { Search, Filter, Save, X, ChevronRight, ArrowLeft, Calendar, DollarSign, Users, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { focusField } from '../utils/formValidation';

const Promotion = () => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [designationFilter, setDesignationFilter] = useState('All');

  const [promotions, setPromotions] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [reason, setReason] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const newRoleRef = useRef(null);
  

  const [employees, setEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/users`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.users || data;
        const normalized = list.map(u => ({
          id: u.id,
          name: u.fullname || u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User ${u.id}`,
          dept: u.department || u.dept || 'General',
          tenure: u.date_of_joining ? `${Math.max(0, new Date().getFullYear() - new Date(u.date_of_joining).getFullYear())} Years` : (u.tenure || 'N/A'),
          currentRole: u.designation || u.currentRole || 'N/A',
          currentSalary: u.salary || u.currentSalary || '0.00 to 6.00',
          employeeId: u.employee_id || u.employeeId || `EMP-${u.id}`,
          original: u
        }));
        setEmployees(normalized);
        if (!selectedEmployee && normalized.length) setSelectedEmployee(normalized[0]);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(emp => 
    departmentFilter === 'All' || emp.dept === departmentFilter
  ).filter(emp =>
    designationFilter === 'All' || emp.currentRole.includes(designationFilter)
  );

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const fetchPromotions = async () => {
    setLoadingPromotions(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/promotions`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (res.ok) {
        const json = await res.json();
        setPromotions(json.promotions || []);
      }
    } catch (err) {
      console.error('Failed to fetch promotions', err);
    } finally {
      setLoadingPromotions(false);
    }
  };

  React.useEffect(() => {
    fetchPromotions();
    fetchEmployees();
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(u.role === 'Admin');
  }, []);

  const savePromotion = async () => {
    if (!isAdmin) {
      alert('Only admins can save promotions');
      return;
    }
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }
    if (!newRole) {
      alert('Please select a new role');
      focusField(newRoleRef.current);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ employee_id: selectedEmployee.id, new_role: newRole, new_salary: newSalary, reason })
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || 'Failed to save promotion');
        return;
      }

      alert('Promotion saved');
      setNewRole(''); setNewSalary(''); setReason('');
      fetchPromotions();
    } catch (err) {
      console.error('Save promotion failed', err);
      alert('Failed to save promotion');
    }
  };

  const applyToPromotion = async (promotionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login'); return; }
      const cover = prompt('Enter a short cover note (optional)') || '';
      const res = await fetch(`${apiBase}/api/promotions/${promotionId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cover_letter: cover })
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || 'Apply failed'); return; }
      alert('Application submitted');
    } catch (err) {
      console.error('Apply failed', err);
      alert('Apply failed');
    }
  };

  // Admin: fetch applications for a promotion
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [viewingPromotionId, setViewingPromotionId] = useState(null);

  const fetchApplications = async (promotionId) => {
    setAppsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/promotions/${promotionId}/applications`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (res.ok) {
        const json = await res.json();
        setApplications(json.applications || []);
        setViewingPromotionId(promotionId);
      } else {
        const json = await res.json();
        alert(json.message || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setAppsLoading(false);
    }
  };

  const updateApplicationStatus = async (promotionId, appId, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login'); return; }
      const res = await fetch(`${apiBase}/api/promotions/${promotionId}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || 'Failed to update'); return; }
      alert('Application updated');
      // Refresh apps, promotions and employee data
      fetchApplications(promotionId);
      fetchPromotions();
      fetchEmployees();
    } catch (err) {
      console.error('Failed to update application', err);
      alert('Failed to update application');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-4">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-900">HRMS</h2>
            <ChevronRight className="text-gray-400" size={20} />
            <h3 className="text-xl font-semibold text-blue-600">Employee Promotion</h3>
          </div>
          <p className="text-gray-600 mt-2">Review and update employee promotion details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Employee List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h2 className="text-xl font-bold">Employee Promotion</h2>
                <p className="text-blue-100">Review and update employee promotion details</p>
              </div>
              
              {/* Search and Filter Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by Name / ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="All">Filter by Department</option>
                        <option value="IT">IT</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        value={designationFilter}
                        onChange={(e) => setDesignationFilter(e.target.value)}
                        className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="All">Filter by Designation</option>
                        <option value="Software">Software Engineer</option>
                        <option value="Sales">Sales Executive</option>
                        <option value="HR">HR Manager</option>
                        <option value="Finance">Finance Analyst</option>
                      </select>
                    </div>
                  </div>
                </div>

                  {/* Promotions List */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Promotions</h4>
                    <div className="space-y-2">
                      {loadingPromotions ? (
                        <div className="text-sm text-gray-500">Loading promotions…</div>
                      ) : promotions.length === 0 ? (
                        <div className="text-sm text-gray-500">No promotions yet</div>
                      ) : promotions.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{p.employee_name} → <span className="text-green-600">{p.new_role}</span></div>
                              <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</div>
                            </div>
                            <div>
                              {isAdmin && (
                                <div className="flex items-center gap-3">
                                  <button onClick={() => fetchApplications(p.id)} className="text-sm text-blue-600">View Applications</button>
                                  <button onClick={() => applyToPromotion(p.id)} className="text-sm text-blue-600">Create Application</button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Applications panel for admins */}
                          {isAdmin && viewingPromotionId === p.id && (
                            <div className="mt-3 bg-white border rounded p-3">
                              {appsLoading ? (
                                <div className="text-sm text-gray-500">Loading applications…</div>
                              ) : applications.length === 0 ? (
                                <div className="text-sm text-gray-500">No applications yet</div>
                              ) : (
                                <div className="space-y-2">
                                  {applications.map(app => (
                                    <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                                      <div>
                                        <div className="font-medium text-gray-900">{app.applicant_name} <span className="text-xs text-gray-500">({app.applicant_email})</span></div>
                                        <div className="text-sm text-gray-500">{app.cover_letter}</div>
                                        <div className="text-xs mt-1">Status: <span className="font-semibold">{app.status}</span></div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => updateApplicationStatus(p.id, app.id, 'accepted')} className="px-3 py-1 bg-green-100 text-green-700 rounded">Accept</button>
                                        <button onClick={() => updateApplicationStatus(p.id, app.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-700 rounded">Reject</button>
                                        <button onClick={() => updateApplicationStatus(p.id, app.id, 'cancelled')} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded">Cancel</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Employee Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">CurrentRole</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Department</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Experience</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredEmployees.map((emp) => (
                          <tr 
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedEmployee?.id === emp.id 
                                ? 'bg-blue-50 border-l-4 border-blue-500' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-4 px-6">
                              <div className="font-semibold text-gray-900">{emp.name}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-700">{emp.currentRole}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                emp.dept === 'IT' ? 'bg-blue-100 text-blue-800' :
                                emp.dept === 'Sales' ? 'bg-purple-100 text-purple-800' :
                                emp.dept === 'HR' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {emp.dept}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar size={16} className="text-gray-400" />
                                {emp.tenure}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 font-semibold">1.00/10.15</span>
                                {emp.name === 'Emilly' && (
                                  <span className="text-green-600 font-semibold">7.00/10.15</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300 mx-6"></div>
            </div>
          </div>

          {/* Right Section - Promotion Form (admin only) */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full">
                <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <h2 className="text-xl font-bold">Promotion Form</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Current Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-bold text-gray-900">Current Details</h3>
                    </div>
                    
                    <div className="space-y-4 bg-blue-50 p-5 rounded-xl border border-blue-100">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                          <Users size={14} />
                          Employee Name
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedEmployee?.name || 'Emilly'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-600">Employee ID</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedEmployee?.employeeId || 'EMP-987'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-600">Current Role</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedEmployee?.currentRole || 'Sales Executive'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-600">Department</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedEmployee?.dept || 'Sales'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                          <DollarSign size={14} />
                          Current Salary
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedEmployee?.currentSalary || '0.00 to 6.00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Promotion Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-bold text-gray-900">New Promotion Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          New Role
                        </label>
                        <select ref={newRoleRef} value={newRole} onChange={(e)=>setNewRole(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                          <option value="">Select Role</option>
                          <option>Senior Software Engineer</option>
                          <option>Senior Sales Executive</option>
                          <option>Senior HR Manager</option>
                          <option>Senior Finance Analyst</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          New Salary
                        </label>
                        <input
                          type="text"
                          value={newSalary}
                          onChange={(e)=>setNewSalary(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="--Enter salary--"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Promotion Reason
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e)=>setReason(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          rows="4"
                          placeholder="Enter Reason for Promotion......"
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button onClick={savePromotion} className={`flex-1 ${isAdmin ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl`}>
                          <Save size={18} />
                          Save Promotion
                        </button>
                        <button onClick={()=>{ setNewRole(''); setNewSalary(''); setReason(''); }} className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 px-6 py-3 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                          <X size={18} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Promotion;
