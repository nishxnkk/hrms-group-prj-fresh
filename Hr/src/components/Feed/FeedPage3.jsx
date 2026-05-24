import { useState, useEffect } from 'react';
import * as employeeOfMonthService from '../../services/employeeOfMonthService';
import { Calendar, Clock, Trophy, Users, Plus, X, Trash2, Award, ChevronRight, ArrowLeft } from 'lucide-react';
import { getAllEvents } from '../../services/event.service';
import { Link, useNavigate } from 'react-router-dom'

const FeedPage3 = ({ onNavigateBack }) => {
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);

    const [isAdmin, setIsAdmin] = useState(false);
    const [userPoints, setUserPoints] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        userId: '',
        description: '',
        month: '',
        teamMembers: [{ userId: '', role: '' }]
    });

    // Fetch user points and refresh on activity updates
    useEffect(() => {
        const fetchUserPoints = async () => {
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                if (!u || !u.id) return;
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${u.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
                if (!res.ok) return;
                const data = await res.json();
                setUserPoints(data.user?.points || 0);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
            } catch (err) {
                console.error('Failed to fetch user points', err);
            }
        };
        fetchUserPoints();
        const onActivity = () => fetchUserPoints();
        window.addEventListener('activity:updated', onActivity);
        return () => window.removeEventListener('activity:updated', onActivity);
    }, []);

    const navigate = useNavigate();

    const handleBack = () => {
        if (onNavigateBack && typeof onNavigateBack === 'function') onNavigateBack();
        navigate(-1);
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setIsAdmin(user.role === 'Admin');
        }
        fetchEmployeeOfMonth();
    }, []);

    const fetchEmployeeOfMonth = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await employeeOfMonthService.getCurrentEmployeeOfMonth();
            if (response.success) {
                setEmployeeData(response.data);
            }
        } catch (error) {
            console.error('Error fetching employee of the month:', error);
            setError('Failed to load employee of the month');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setError(null);
            console.log('Fetching users...');
            const response = await employeeOfMonthService.getAllUsers();
            if (response.success) {
                setUsers(response.users || []);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const handleOpenModal = async () => {
        setShowModal(true);
        await fetchUsers();
    };

    // Events for feed
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);

    const getEventCategory = (eventDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDateObj = new Date(eventDate);
        eventDateObj.setHours(0, 0, 0, 0);
        return eventDateObj >= today ? 'upcoming' : 'past';
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setEventsLoading(true);
                const res = await getAllEvents();
                const ev = Array.isArray(res) ? res : (res.events || res);
                setEvents(ev || []);
            } catch (err) {
                console.error('Failed to fetch events', err);
            } finally {
                setEventsLoading(false);
            }
        };
        fetchEvents();
        const onEventsUpdated = () => fetchEvents();
        window.addEventListener('events:updated', onEventsUpdated);
        window.addEventListener('activity:updated', onEventsUpdated);
        return () => {
            window.removeEventListener('events:updated', onEventsUpdated);
            window.removeEventListener('activity:updated', onEventsUpdated);
        };
    }, []);

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            userId: '',
            description: '',
            month: '',
            teamMembers: [{ userId: '', role: '' }]
        });
    };

    const handleAddTeamMember = () => {
        setFormData({
            ...formData,
            teamMembers: [...formData.teamMembers, { userId: '', role: '' }]
        });
    };

    const handleRemoveTeamMember = (index) => {
        const newTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            teamMembers: newTeamMembers
        });
    };

    const handleTeamMemberChange = (index, field, value) => {
        const newTeamMembers = [...formData.teamMembers];
        newTeamMembers[index][field] = value;
        setFormData({
            ...formData,
            teamMembers: newTeamMembers
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const teamMembers = formData.teamMembers.filter(
                member => member.userId && member.role
            );

            await employeeOfMonthService.createEmployeeOfMonth(
                parseInt(formData.userId),
                formData.description,
                formData.month,
                teamMembers.map(member => ({
                    userId: parseInt(member.userId),
                    role: member.role
                }))
            );

            handleCloseModal();
            fetchEmployeeOfMonth();
        } catch (error) {
            console.error('Error creating employee of the month:', error);
            alert('Failed to create employee of the month');
        }
    };

    const handleDeleteTeamMember = async (teamMemberId) => {
        if (window.confirm('Are you sure you want to remove this team member?')) {
            try {
                await employeeOfMonthService.deleteTeamMember(teamMemberId);
                fetchEmployeeOfMonth();
            } catch (error) {
                console.error('Error deleting team member:', error);
                alert('Failed to delete team member');
            }
        }
    };

    const handleDeleteEmployeeOfMonth = async () => {
        if (window.confirm('Are you sure you want to delete the Employee of the Month? This will remove the entire entry and team.')) {
            try {
                await employeeOfMonthService.deleteEmployeeOfMonth(employeeData.id);
                setEmployeeData(null);
            } catch (error) {
                console.error('Error deleting employee of the month:', error);
                alert('Failed to delete employee of the month');
            }
        }
    };

    return (
        <div className="p-6 dark:bg-[#0C1014] sm:p-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 dark:hover:text-[#88AAFF] p-2 rounded-lg" aria-label="Go back">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-[#020839] dark:text-white tracking-tight">Feed & Recognition</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Celebrate success and stay updated with the team.</p>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleOpenModal}
                        className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add New
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="xl:col-span-2 space-y-8">
                    {loading ? (
                        <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-12 text-center">
                            <div className="w-10 h-10 border-4 border-orange-500 dark:border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading recognitions...</p>
                        </div>
                    ) : employeeData ? (
                        <>
                            {/* Employee of the Month Card */}
                            <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-8 relative overflow-hidden group">

                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#020839] to-orange-500"></div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-8 z-10 relative">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 dark:bg-orange-500/20 p-2.5 rounded-lg text-orange-600 dark:text-orange-400">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-[#AACCFF] dark:text-[#4dabf7]">Employee of the Month</h2>
                                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{employeeData.month}</p>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={handleDeleteEmployeeOfMonth}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Featured Employee Content */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-6">
                                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-orange-50">
                                            <img
                                                src={`https://i.pravatar.cc/200?u=${employeeData.user_email}`}
                                                alt={employeeData.user_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            <Award size={20} />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-[#AACCFF] dark:text-[#4dabf7] mb-2">{employeeData.user_name}</h3>

                                    <div className="max-w-xl mx-auto mt-4 px-6 py-4 bg-gray-50 dark:bg-[#0C1014] rounded-xl border border-gray-100 dark:border-gray-700 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 border-t border-l border-gray-100 transform rotate-45"></div>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                            "{employeeData.description}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Team Section */}
                            {employeeData.team && employeeData.team.length > 0 && (
                                <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-8">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Users size={20} className="text-[#020839] dark:text-[#4dabf7]" />
                                        <h3 className="text-lg font-bold text-[#020839] dark:text-white">Key Contributors</h3>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {employeeData.team.map((member) => (
                                            <div key={member.id} className="relative group bg-gray-50 dark:bg-[#0C1014] rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-[#88AAFF] dark:hover:border-[#88AAFF]/50 transition-colors">
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteTeamMember(member.id)}
                                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}

                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={`https://i.pravatar.cc/150?u=${member.user_email}`}
                                                        alt={member.user_name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-[#020839] dark:text-white text-sm truncate">{member.user_name}</h4>
                                                        <p className="text-orange-600 dark:text-orange-400 text-xs font-medium truncate group-hover:text-[#88AAFF]">{member.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-12 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-[#0C1014] rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy size={32} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-[#020839] dark:text-white mb-2">No Recognition Yet</h3>                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Start celebrating your team's success by adding the first Employee of the Month.</p>
                            {isAdmin ? (
                                <button
                                    onClick={handleOpenModal}
                                    className="bg-[#020839] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-opacity-90 transition-all shadow-sm"
                                >
                                    Recognize Someone
                                </button>
                            ) : (
                                <p className="text-sm text-gray-500">Only admins can create Employee of the Month entries. Contact your administrator if you need to recognize someone.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Points Card */}
                    <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Reward Points</h3>
                            <div className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">NEW</div>
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-bold text-[#020839] dark:text-white">{userPoints?.toLocaleString() || 0}</span>
                            <span className="text-sm text-gray-400 font-medium mb-1">pts available</span>
                        </div>
                        <Link to="/redemption" className="w-full block bg-[#020839] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all text-center">
                            Redeem Rewards
                        </Link>
                    </div>

                    {/* Upcoming Events (dynamic) */}
                    <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                            <Calendar size={18} className="text-orange-500" />
                            <h3 className="font-bold text-[#020839] dark:text-white">Upcoming Events</h3>
                        </div>
                        <div className="space-y-4">
                            {eventsLoading ? (
                                <p className="text-sm text-gray-500">Loading events...</p>
                            ) : events.filter(e => getEventCategory(e.event_date) === 'upcoming').length === 0 ? (
                                <p className="text-sm text-gray-500">No upcoming events</p>
                            ) : (
                                events
                                    .filter(e => getEventCategory(e.event_date) === 'upcoming')
                                    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                                    .slice(0, 3)
                                    .map((ev, idx) => (
                                        <div key={ev.id || idx} className="flex items-start gap-3 group cursor-pointer">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-orange-500' : 'bg-purple-500'} mt-1.5`}></div>
                                                {idx !== 2 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1"></div>}
                                            </div>
                                            <div className="flex-1 pb-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#88AAFF] transition-colors">{ev.title}</p>
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-[#0C1014] px-1.5 py-0.5 rounded">{`${ev.attendee_count ?? 0} attending`}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {ev.start_time || ''}{ev.end_time ? ` - ${ev.end_time}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                        <Link to="/event" className="w-full mt-4 text-xs font-bold text-gray-400 hover:text-[#020839] dark:hover:text-white flex items-center justify-center gap-1 uppercase tracking-wide transition-colors">
                            View Events <ChevronRight size={12} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#020839]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#020839] dark:text-white">Add Recognition</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Employee Selection */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Core Info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.userId}
                                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0C1014] text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#88AAFF]/20 focus:border-[#88AAFF] appearance-none font-medium transition-all"
                                                    required
                                                >
                                                    <option value="">Choose...</option>
                                                    {users.map((user) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.fullname}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-3 top-3 text-gray-400 rotate-90 w-4 h-4 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                                            <input
                                                type="text"
                                                value={formData.month}
                                                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                                placeholder="e.g. December 2025"
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0C1014] text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-700 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Why does this employee deserve recognition?"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0C1014] text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#88AAFF]/20 focus:border-[#88AAFF] min-h-[120px] resize-none transition-all"
                                        required
                                    />
                                </div>

                                {/* Team Members */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Team Recognition</h3>
                                        <button
                                            type="button"
                                            onClick={handleAddTeamMember}
                                            className="text-orange-600 text-sm font-semibold hover:text-orange-700 flex items-center gap-1"
                                        >
                                            <Plus size={16} /> Add Member
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.teamMembers.map((member, index) => (
                                            <div key={index} className="flex gap-4 items-start bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                                                <div className="flex-1 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Member</label>
                                                        <select
                                                            value={member.userId}
                                                            onChange={(e) => handleTeamMemberChange(index, 'userId', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0C1014] text-gray-700 dark:text-white text-sm focus:outline-none focus:border-orange-500 bg-white"
                                                        >
                                                            <option value="">Select...</option>
                                                            {users.map((user) => (
                                                                <option key={user.id} value={user.id}>{user.fullname}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                                                        <input
                                                            type="text"
                                                            value={member.role}
                                                            onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0C1014] text-gray-700 dark:text-white text-sm focus:outline-none focus:border-orange-500"
                                                            placeholder="Role in project"
                                                        />
                                                    </div>
                                                </div>
                                                {formData.teamMembers.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTeamMember(index)}
                                                        className="mt-6 text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex gap-4 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-2.5 bg-[#020839] text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-900/20"
                                    >
                                        Save Recognition
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedPage3;
