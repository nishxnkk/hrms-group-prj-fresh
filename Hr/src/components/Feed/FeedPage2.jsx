import { useState, useEffect } from 'react';
import {
    getAllAppreciations,
    toggleLike,
    deleteAppreciation,
    addComment,
    getComments
} from '../../services/appreciationService';
// Ensure you have created this file in src/services/meetingService.js
import { getUpcomingMeetings } from '../../services/meetingService';
import { Link } from 'react-router-dom';
import { getAllEvents } from '../../services/event.service';
import Promotion from '../../pages/Promotion';

const FeedPage2 = ({ onNavigateToPage2, onNavigateToPage3, onNavigateToCreateForm }) => {
    const [appreciations, setAppreciations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [meetings, setMeetings] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setIsAdmin(user.role === 'Admin');
        }
        fetchAppreciations();
        fetchMeetings();

        const fetchUserPoints = async () => {
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                if (!u || !u.id) return;
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${u.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
                if (!res.ok) return;
                const data = await res.json();
                setUserPoints(data.user?.points || 0);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch (err) {
                console.error('Failed to fetch user points', err);
            }
        };

        fetchUserPoints();
        const onActivity = () => fetchUserPoints();
        window.addEventListener('activity:updated', onActivity);
        return () => window.removeEventListener('activity:updated', onActivity);
    }, []);

    const fetchAppreciations = async () => {
        try {
            setLoading(true);
            const response = await getAllAppreciations('feed');
            if (response.success) {
                setAppreciations(response.data);
            }
        } catch (err) {
            setError('Failed to load appreciations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMeetings = async () => {
        try {
            const res = await getUpcomingMeetings();

            const meetingsData =
                res?.data?.data ||
                res?.data ||
                res?.meetings ||
                [];

            if (Array.isArray(meetingsData)) {
                // 1. Get today's date
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // 2. Filter: Keep only future/today meetings
                const upcomingOnly = meetingsData.filter((meeting) => {
                    const meetingDate = new Date(meeting.meeting_date);
                    // Reset meeting time to midnight for accurate date comparison
                    meetingDate.setHours(0, 0, 0, 0);
                    return meetingDate >= today;
                });

                // 3. Sort: Compare Date AND Time
                upcomingOnly.sort((a, b) => {
                    // Create Date objects for sorting
                    const dateA = new Date(a.meeting_date);
                    const dateB = new Date(b.meeting_date);

                    // If dates are different, sort by date
                    if (dateA.getTime() !== dateB.getTime()) {
                        return dateA - dateB;
                    }

                    // If dates are the same, compare times (HH:MM:SS)
                    // We treat the time strings like "11:00:00" vs "19:00:00"
                    if (a.start_time < b.start_time) return -1;
                    if (a.start_time > b.start_time) return 1;
                    return 0;
                });

                // 4. Update state with the nearest meeting at index 0
                setMeetings(upcomingOnly);
            }
        } catch (err) {
            console.error('Failed to load meetings:', err);
        }
    };

    // Events for feed
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);

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

    const handleLike = async (appreciationId) => {
        try {
            await toggleLike(appreciationId);
            fetchAppreciations();
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    const handleDelete = async (appreciationId) => {
        if (window.confirm('Are you sure you want to delete this appreciation?')) {
            try {
                await deleteAppreciation(appreciationId);
                setAppreciations(prev => prev.filter(a => a.id !== appreciationId));
                try { window.dispatchEvent(new CustomEvent('activity:updated')); } catch (e) { }
            } catch (err) {
                alert('Failed to delete appreciation. You can only delete your own posts.');
                console.error(err);
            }
        }
    };

    const handleCommentChange = (appreciationId, value) => {
        setCommentInputs(prev => ({
            ...prev,
            [appreciationId]: value
        }));
    };

    const handleAddComment = async (appreciationId) => {
        const commentText = commentInputs[appreciationId];
        if (!commentText || commentText.trim() === '') return;

        try {
            await addComment(appreciationId, commentText);
            setCommentInputs(prev => ({
                ...prev,
                [appreciationId]: ''
            }));
            fetchAppreciations();
            if (showComments[appreciationId]) {
                fetchComments(appreciationId);
            }
        } catch (err) {
            alert('Failed to add comment');
            console.error(err);
        }
    };

    const toggleCommentsView = async (appreciationId) => {
        const isCurrentlyShown = showComments[appreciationId];

        setShowComments(prev => ({
            ...prev,
            [appreciationId]: !isCurrentlyShown
        }));

        if (!isCurrentlyShown) {
            fetchComments(appreciationId);
        }
    };

    const fetchComments = async (appreciationId) => {
        try {
            const response = await getComments(appreciationId);
            if (response.success) {
                setComments(prev => ({
                    ...prev,
                    [appreciationId]: response.data
                }));
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 sm:p-8 dark:bg-[#0C1014] min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#266ECD] dark:text-[#4dabf7]">Feed</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay Connected and Informed: Your Hub for Updates and Interaction</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {(
                            <button
                                onClick={onNavigateToCreateForm}
                                className="flex items-center gap-2 bg-[#266ECD] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all shadow-md"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>New</span>
                            </button>
                        )}
                        <button
                            onClick={fetchAppreciations}
                            className="text-red-500 hover:text-red-600"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-8">
                                <button
                                    onClick={onNavigateToPage3}
                                    className="pb-3 text-gray-900 dark:text-white font-semibold border-b-4 border-[#266ECD] -mb-0.5"
                                >
                                    Employee of the Month
                                </button>
                                <button className="pb-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">
                                    <Link to="/promotion">Promotions</Link>
                                </button>
                            </div>
                            <div>
                                <Link to="/appreciation/new" className="ml-4 inline-block bg-[#266ECD] text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90">New Appreciation</Link>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#266ECD]"></div>
                                <p className="mt-4 text-gray-600">Loading appreciations...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Appreciations List */}
                        {!loading && !error && appreciations.length === 0 && (
                            <div className="bg-white dark:bg-[#1F2429] rounded-2xl shadow-md p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No appreciations yet. Be the first to create one!</p>
                                {isAdmin && (
                                    <button
                                        onClick={onNavigateToCreateForm}
                                        className="mt-4 bg-[#266ECD] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90"
                                    >
                                        Create Appreciation
                                    </button>
                                )}
                            </div>
                        )}

                        {!loading && appreciations.map((appreciation) => (
                            <div key={appreciation.id} className="bg-white dark:bg-[#1F2429] rounded-2xl shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                {appreciation.sender_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{appreciation.sender_name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{appreciation.sender_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
                                                APPRECIATED 🎉
                                            </span>
                                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                                {appreciation.recipient_name?.charAt(0) || 'U'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-sm text-gray-600">to</span>
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                            {appreciation.recipient_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{appreciation.recipient_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{appreciation.recipient_email}</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{formatDate(appreciation.created_at)}</span>
                                            <span>{formatTime(appreciation.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#1F2429] border border-gray-200 dark:border-[#333] rounded-2xl p-6 mb-5 shadow-md">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="text-3xl">{appreciation.emoji}</span>
                                            <h3 className="text-xl font-bold text-teal-900 dark:text-teal-400">{appreciation.title}</h3>
                                        </div>
                                        <div className="mb-4">
                                            <span className="bg-teal-200 text-teal-900 px-4 py-1.5 rounded-full text-sm font-bold">
                                                {appreciation.category}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                            {appreciation.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => handleLike(appreciation.id)}
                                            className={`flex items-center gap-2 ${appreciation.user_liked
                                                ? 'text-purple-700 dark:text-purple-400'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-400'
                                                }`}
                                        >
                                            <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                                                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                            </svg>
                                            <span className="font-bold text-base">{appreciation.likes_count || 0}</span>
                                        </button>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            {appreciation.points > 0 && (
                                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">+{appreciation.points} pts</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleCommentsView(appreciation.id)}
                                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <span className="font-medium">{appreciation.comments_count || 0}</span>
                                        </button>
                                        {(() => {
                                            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                            if (currentUser && currentUser.id && (currentUser.id === appreciation.sender_id || currentUser.role === 'Admin')) {
                                                return (
                                                    <button
                                                        onClick={() => handleDelete(appreciation.id)}
                                                        className="ml-auto text-red-500 hover:text-red-700"
                                                        title="Delete appreciation"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Comments Section */}
                                    {showComments[appreciation.id] && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#333]">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Comments</h4>

                                            {/* Comment Input */}
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={commentInputs[appreciation.id] || ''}
                                                    onChange={(e) => handleCommentChange(appreciation.id, e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddComment(appreciation.id);
                                                        }
                                                    }}
                                                    placeholder="Add a comment..."
                                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0C1014] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#266ECD] focus:border-transparent outline-none"
                                                />
                                                <button
                                                    onClick={() => handleAddComment(appreciation.id)}
                                                    className="bg-[#266ECD] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90"
                                                >
                                                    Post
                                                </button>
                                            </div>

                                            {/* Comments List */}
                                            <div className="space-y-3">
                                                {comments[appreciation.id]?.map((comment) => (
                                                    <div key={comment.id} className="bg-gray-50 dark:bg-[#0C1014] rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{comment.user_name}</p>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.comment}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                                    {formatDate(comment.created_at)} at {formatTime(comment.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!comments[appreciation.id] || comments[appreciation.id].length === 0) && (
                                                    <p className="text-sm text-gray-300 text-center py-4">No comments yet. Be the first to comment!</p>
                                                )}
                                            </div>
                                        </div>

                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* New Point Alert */}
                        <div className="bg-white dark:bg-[#1F2429] rounded-2xl shadow-md p-6 border border-gray-100 dark:border-[#1F2429]">
                            <h3 className="text-lg font-bold text-[#266ECD] dark:text-[#4dabf7] mb-4">New Point Alert!</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-5xl font-bold text-[#266ECD] dark:text-[#4dabf7]">{userPoints?.toLocaleString() || 0}</div>
                                <div className="w-10 h-10 rounded-full bg-[#266ECD] flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Reward points balance</p>
                            <button
                                onClick={onNavigateToPage2}
                                className="w-full bg-[#266ECD] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                            >
                                Attempt
                            </button>
                        </div>

                        {/* Don't Miss Out! Upcoming Training Session */}
                        <div className="bg-white dark:bg-[#1F2429] rounded-2xl shadow-md p-6 border border-gray-100 dark:border-[#1F2429]">
                            <h3 className="text-lg font-bold text-[#266ECD] dark:text-[#4dabf7] mb-4">
                                Don't Miss Out! Upcoming Training Session
                            </h3>

                            {/* Check if we have at least one meeting */}
                            {meetings.length > 0 ? (
                                <div className="space-y-2 mb-5">
                                    {/* We only render meetings[0] -> The single nearest meeting */}
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {meetings[0].title}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-bold">Date:</span>{" "}
                                        {meetings[0].meeting_date ? new Date(meetings[0].meeting_date).toLocaleDateString() : 'TBA'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-bold">Time:</span>{" "}
                                        {meetings[0].start_time} - {meetings[0].end_time}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mb-5">No upcoming meetings</p>
                            )}

                            <button className="w-full bg-[#266ECD] text-white px-6 py-2.5 rounded-xl font-bold">
                                Register
                            </button>
                        </div>

                        {/* Upcoming Events (dynamic) */}
                        <div className="bg-white dark:bg-[#1F2429] rounded-2xl shadow-md p-6 border border-gray-100 dark:border-[#1F2429]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Upcoming Events
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {eventsLoading ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading events...</p>
                                ) : events.filter(e => new Date(e.event_date) >= new Date().setHours(0, 0, 0)).length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
                                ) : (
                                    events
                                        .filter(e => new Date(e.event_date) >= new Date().setHours(0, 0, 0))
                                        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                                        .slice(0, 4)
                                        .map(ev => (
                                            <div key={ev.id} className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{ev.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{ev.start_time || ''}{ev.end_time ? ` - ${ev.end_time}` : ''}</p>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{`${ev.attendee_count ?? 0} attending`}</span>
                                            </div>
                                        ))
                                )}
                                <Link to="/event" className="text-[#266ECD] dark:text-[#4dabf7] text-sm font-semibold hover:underline">More...</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default FeedPage2;