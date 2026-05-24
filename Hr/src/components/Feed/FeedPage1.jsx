import { useState, useEffect } from 'react';
import {
    createAppreciation,
    addComment,
    getAllUsers,
    getAllAppreciations,
    getComments,
    toggleLike,
    deleteAppreciation
} from '../../services/appreciationService';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getAllEvents } from '../../services/event.service';

const FeedPage1 = ({ onNavigateBack }) => {
    // State for the "Give Points" interaction
    const [showGivePointsModal, setShowGivePointsModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [appreciations, setAppreciations] = useState([]);
    const [givePointsData, setGivePointsData] = useState({
        recipient_id: '',
        recipient_email: '',
        title: 'Appreciation',
        category: 'Hard Work',
        message: '',
        points: 0,
        emoji: '👏'
    });

    // Helper to refresh feed
    const fetchFeed = async () => {
        try {
            const response = await getAllAppreciations();
            if (response && response.data) {
                setAppreciations(response.data);
            } else if (Array.isArray(response)) {
                setAppreciations(response);
            }
        } catch (error) {
            console.error("Failed to fetch appreciations", error);
        }
    };

    // Fetch initial data
    const [userPoints, setUserPoints] = useState(0);

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllUsers();
                if (response && response.users) {
                    setUsers(response.users);
                } else if (Array.isArray(response)) {
                    setUsers(response);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };

        const fetchUserPoints = async () => {
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                if (!u || !u.id) return;
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/${u.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
                if (!res.ok) return;
                const data = await res.json();
                setUserPoints(data.user?.points || 0);
                // update local user copy
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setIsAdmin(data.user.role === 'Admin');
                }
            } catch (err) {
                console.error('Failed to fetch user points', err);
            }
        };

        fetchUsers();
        fetchFeed();
        fetchUserPoints();

        // listen for activity updates to refresh points
        const onActivity = () => fetchUserPoints();
        window.addEventListener('activity:updated', onActivity);
        return () => window.removeEventListener('activity:updated', onActivity);
    }, []);

    // Events for feed (upcoming/past)
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
            } catch (e) {
                console.error('Failed to fetch events', e);
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

    const handleGivePoints = () => {
        setShowGivePointsModal(true);
    };

    const handleLike = async (id) => {
        try {
            await toggleLike(id);
            fetchFeed(); // Refresh to show updated like count and state
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this appreciation?")) return;
        try {
            await deleteAppreciation(id);
            fetchFeed(); // Refresh to remove deleted item
            try { window.dispatchEvent(new CustomEvent('activity:updated')); } catch (e) { }
        } catch (error) {
            console.error("Failed to delete appreciation", error);
            alert("Failed to delete. You might not have permission.");
        }
    };

    const submitPoints = async () => {
        try {
            if (!givePointsData.recipient_id || !givePointsData.message || (givePointsData.points <= 0 && givePointsData.category !== 'Appreciation')) {
                // Relaxed validation: points can be 0 if it's just an appreciation, but frontend "Give Points" implies points.
                // If the user wants just "Appreciation", we might need a separate mode. For now, enforcing points.
                if (!givePointsData.points) {
                    alert("Please enter points amount.");
                    return;
                }
            }

            // Check balance (admins can send unlimited points)
            if (parseInt(givePointsData.points, 10) <= 0) {
                alert('Please enter a positive points amount');
                return;
            }
            if (!isAdmin && parseInt(givePointsData.points, 10) > userPoints) {
                alert('Insufficient points to send');
                return;
            }

            // Call backend API
            const resp = await createAppreciation({
                recipient_id: parseInt(givePointsData.recipient_id),
                title: givePointsData.title,
                category: givePointsData.category,
                message: givePointsData.message,
                points: parseInt(givePointsData.points),
                emoji: givePointsData.emoji
            });

            // If transfer info present, update user points
            if (resp && resp.transfer && resp.transfer.sender) {
                const newPoints = resp.transfer.sender.points || 0;
                setUserPoints(newPoints);
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...localUser, points: newPoints }));
            }

            alert(`Successfully sent ${givePointsData.points} points!`);
            setShowGivePointsModal(false);
            setGivePointsData({
                recipient_id: '',
                recipient_email: '',
                title: 'Appreciation',
                category: 'Hard Work',
                message: '',
                points: 0,
                emoji: '👏'
            });
            // Refresh feed to show new card
            fetchFeed();
            // Notify other pages to refresh points and leaderboard
            try { window.dispatchEvent(new CustomEvent('activity:updated')); } catch (e) { }
            // Notify other pages
            try { window.dispatchEvent(new CustomEvent('activity:updated')); } catch (e) { }
        } catch (error) {
            console.error(error);
            alert('Failed to send points: ' + (error.message || JSON.stringify(error)));
        }
    };

    return (
        <div className="p-4 sm:p-8 dark:bg-[#0C1014] min-h-screen transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={onNavigateBack}
                            className="text-gray-600 hover:text-gray-800 dark:text-[#AACCFF] dark:hover:text-[#88AAFF] mb-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-[#266ECD] dark:text-[#AACCFF]">Give Points & Appreciate</h1>
                        <p className="text-gray-600 dark:text-[#AACCFF]">Recognize your colleagues' hard work.</p>
                    </div>
                    <button
                        onClick={handleGivePoints}
                        className="bg-[#266ECD] dark:bg-[#2C50AB] text-white dark:text-[#AACCFF] px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 dark:hover:bg-[#88AAFF] transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Give Points
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Feed Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Give Points Banner */}
                        <div className="flex flex-col items-center justify-center py-8 bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429]">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Send Appreciation</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md text-sm">
                                Share points and a message to recognize someone's contribution.
                            </p>
                            <button
                                onClick={handleGivePoints}
                                className="bg-[#266ECD] dark:bg-[#2C50AB] text-white dark:text-[#AACCFF] px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:scale-105 dark:hover:bg-[#88AAFF] transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Give Points
                            </button>
                        </div>

                        {/* Dynamic Feed */}
                        <div className="space-y-6">
                            {appreciations.filter(a => a.points > 0).length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-[#1F2429] rounded-xl border border-gray-100 dark:border-[#1F2429] shadow-sm">
                                    <p className="text-gray-500 dark:text-gray-400">No points awarded yet. Be the first to give points!</p>
                                </div>
                            ) : (
                                appreciations
                                    .filter(appreciation => appreciation.points > 0)
                                    .map((appreciation) => (
                                        <PointsCard
                                            key={appreciation.id}
                                            appreciation={appreciation}
                                            onLike={() => handleLike(appreciation.id)}
                                            onDelete={() => handleDelete(appreciation.id)}
                                        />
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">

                        {/* Your Points */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-[#266ECD] dark:text-blue-400 mb-4">
                                Your Points
                            </h3>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-5xl font-bold text-[#266ECD]">
                                    {userPoints?.toLocaleString() || 0}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Reward points balance
                            </p>

                            <Link
                                to="/redemption"
                                className="block text-center bg-[#266ECD] text-white px-6 py-2.5 rounded-xl font-bold"
                            >
                                View Redemption Center
                            </Link>
                        </div>

                        {/* Upcoming Training */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-[#266ECD] dark:text-blue-400 mb-4">
                                Don't Miss Out! Upcoming Training Session
                            </h3>

                            <div className="space-y-2 mb-5">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-bold">Date:</span> 29 Oct
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-bold">Time:</span> 9:00 AM - 12:00 PM
                                </p>
                            </div>

                            <button className="w-full bg-[#266ECD] text-white px-6 py-2.5 rounded-xl font-bold">
                                Register
                            </button>
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                                Upcoming Events
                            </h3>

                            <div className="space-y-4">
                                {eventsLoading ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Loading events...
                                    </p>
                                ) : events.filter(e => getEventCategory(e.event_date) === 'upcoming').length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No upcoming events
                                    </p>
                                ) : (
                                    events
                                        .filter(e => getEventCategory(e.event_date) === 'upcoming')
                                        .slice(0, 3)
                                        .map(ev => (
                                            <div className="flex justify-between items-start" key={ev.id}>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                                                        {ev.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {ev.start_time || ''}
                                                        {ev.end_time ? ` - ${ev.end_time}` : ''}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {`${ev.attendee_count ?? 0} attending`}
                                                </span>
                                            </div>
                                        ))
                                )}

                                <Link
                                    to="/event"
                                    className="text-[#266ECD] text-sm font-semibold hover:underline"
                                >
                                    More...
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {/* Give Points Modal */}
            {showGivePointsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1F2429] rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowGivePointsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Give Points</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                                <select
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0C1014] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#266ECD] outline-none"
                                    value={givePointsData.recipient_id}
                                    onChange={e => setGivePointsData({ ...givePointsData, recipient_id: e.target.value })}
                                >
                                    <option value="">Select a colleague...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.fullname} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0C1014] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#266ECD] outline-none"
                                    placeholder="e.g., 100"
                                    value={givePointsData.points}
                                    onChange={e => setGivePointsData({ ...givePointsData, points: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                <textarea
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0C1014] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#266ECD] outline-none h-24 resize-none"
                                    placeholder="Write your appreciation..."
                                    value={givePointsData.message}
                                    onChange={e => setGivePointsData({ ...givePointsData, message: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={submitPoints}
                                disabled={!givePointsData.recipient_id || !givePointsData.points || (!isAdmin && (parseInt(givePointsData.points || 0, 10) > userPoints))}
                                className={`w-full py-3 rounded-xl font-bold transition shadow-lg ${(!givePointsData.recipient_id || !givePointsData.points || (!isAdmin && (parseInt(givePointsData.points || 0, 10) > userPoints))) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#266ECD] text-white hover:bg-opacity-90'}`}
                            >
                                {(!isAdmin && parseInt(givePointsData.points || 0, 10) > userPoints) ? 'Insufficient points' : 'Send Points'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Subcomponents ---

// 1. Points Card (Visually distinct for points transactions)
const PointsCard = ({ appreciation, onLike, onDelete }) => {
    return (
        <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-md overflow-hidden border-2 border-orange-100 dark:border-[#333]">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white flex items-center justify-center font-bold text-xl">
                            {appreciation.points}
                        </div>
                        <div>
                            <p className="text-lg font-bold text-[#2C50AB] dark:text-[#AACCFF]">
                                <span className="text-[#266ECD] dark:text-[#4dabf7]">{appreciation.sender_name}</span>
                                <span className="font-normal text-gray-500 dark:text-gray-400 mx-2">rewarded</span>
                                <span className="text-[#266ECD] dark:text-[#4dabf7]">{appreciation.recipient_name}</span>
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(appreciation.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    {/* Delete Button - visible to the sender or Admin */}
                    {(() => {
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        if (currentUser && currentUser.id && (currentUser.id === appreciation.sender_id || currentUser.role === 'Admin')) {
                            return (
                                <button
                                    onClick={onDelete}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete Post"
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

                {/* Quote Box */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900">
                    <p className="text-gray-800 dark:text-gray-200 font-medium italic">
                        "{appreciation.message}"
                    </p>

                    <div className="mt-3 flex gap-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full uppercase tracking-wide">
                            {appreciation.category}
                        </span>
                        <span>{appreciation.emoji}</span>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-orange-50">
                    <button
                        onClick={onLike}
                        className={`flex items-center gap-2 transition-colors ${appreciation.user_liked
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-[#88AAFF]'
                            }`}
                    >
                        <svg
                            className={`w-6 h-6 ${appreciation.user_liked
                                ? 'fill-current'
                                : 'fill-none stroke-current'
                                }`}
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                        <span className="text-sm font-medium">
                            {appreciation.likes_count || 0} Likes
                        </span>
                    </button>
                </div>
            </div>

            <CommentSection appreciation={appreciation} />
        </div>
    );
};

// 2. Appreciation Card (Simpler visual style for general recognition)
const AppreciationCard = ({ appreciation }) => {
    return (
        <div className="bg-white dark:bg-[#1F2429] rounded-xl shadow-sm border border-gray-100 dark:border-[#1F2429] p-6">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#266ECD] dark:text-[#4dabf7] flex items-center justify-center font-bold">
                    {appreciation.sender_name ? appreciation.sender_name[0] : 'A'}
                </div>
                <div className="flex-1">
                    <p className="text-gray-900 dark:text-white">
                        <span className="font-bold text-[#266ECD] dark:text-[#4dabf7]">{appreciation.sender_name}</span> appreciated <span className="font-bold text-[#266ECD] dark:text-[#4dabf7]">{appreciation.recipient_name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(appreciation.created_at).toLocaleDateString()}</p>
                    <p className="mt-2 text-gray-800 dark:text-gray-200">{appreciation.message}</p>
                    <div className="mt-2 flex gap-2">
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded">#{appreciation.category}</span>
                        <span>{appreciation.emoji}</span>
                    </div>
                    <div className="mt-4">
                        <Link to={`/appreciation/${appreciation.id}`} className="text-sm text-[#266ECD] dark:text-[#4dabf7] font-medium">Open</Link>
                    </div>
                </div>
            </div>
            <CommentSection appreciation={appreciation} />
        </div>
    );
};

// Shared Comment Section
const CommentSection = ({ appreciation }) => {
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    const fetchComments = async () => {
        try {
            const response = await getComments(appreciation.id);
            if (response && response.data) setComments(response.data);
            else if (Array.isArray(response)) setComments(response);
        } catch (error) {
            console.error(error);
        }
    };

    const toggle = () => {
        if (!showComments) fetchComments();
        setShowComments(!showComments);
    };

    const post = async () => {
        if (!newComment.trim()) return;
        try {
            await addComment(appreciation.id, newComment);
            setNewComment('');
            fetchComments(); // Refresh comments
        } catch (error) {
            console.error("Failed to post comment", error);
            alert("Failed to post comment");
        }
    };

    return (
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-2">
            <div className="flex gap-4">
                <button onClick={toggle} className="text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-[#266ECD] dark:hover:text-[#4dabf7]">
                    Comments ({appreciation.comments_count || 0})
                </button>
            </div>
            {showComments && (
                <div className="mt-4 space-y-4 pb-4">
                    {comments.map(c => (
                        <div key={c.id} className="bg-gray-50 dark:bg-[#0C1014] p-3 rounded-lg text-sm border border-gray-100 dark:border-gray-700">
                            <span className="font-bold text-gray-900 dark:text-white">{c.user_name}</span><span className="text-gray-900 dark:text-gray-300">: {c.comment}</span>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <input
                            className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-3 py-1 text-sm outline-none focus:border-[#266ECD] bg-white dark:bg-[#0C1014] text-gray-900 dark:text-white"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                        />
                        <button onClick={post} className="text-[#266ECD] font-bold text-sm">Post</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedPage1;
