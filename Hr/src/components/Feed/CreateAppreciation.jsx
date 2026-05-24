import { useState, useEffect } from 'react';
import { createAppreciation } from '../../services/appreciationService';
import axios from 'axios';

const CreateAppreciation = ({ onNavigateBack, onSuccess }) => {
    const [formData, setFormData] = useState({
        recipient_id: '',
        title: '',
        category: 'Outstanding Performance',
        message: '',
        emoji: '🎉'
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = [
        'Outstanding Performance',
        'Team Collaboration',
        'Innovation',
        'Leadership',
        'Customer Service',
        'Problem Solving',
        'Dedication'
    ];

    const emojis = ['🎉', '🎊', '🙌', '👏', '⭐', '🏆', '💪', '🌟', '✨', '🔥'];

    // Fetch users for recipient selection
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setUsers(response.data.users || []);
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Validate
            if (!formData.recipient_id || !formData.title || !formData.message) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            const response = await createAppreciation({
                recipient_id: parseInt(formData.recipient_id),
                title: formData.title,
                category: formData.category,
                message: formData.message,
                emoji: formData.emoji
            });

            if (response.success) {
                setSuccess('Appreciation created successfully!');
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    if (onNavigateBack) onNavigateBack();
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'Failed to create appreciation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#266ECD]">Create New Appreciation</h1>
                        <p className="text-sm text-gray-500 mt-1">Recognize and celebrate your colleagues</p>
                    </div>
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Feed
                    </button>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-gray-900 dark:border-gray-700 rounded-2xl shadow-md p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                                {success}
                            </div>
                        )}

                        {/* Recipient Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Recipient <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="recipient_id"
                                value={formData.recipient_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#266ECD] focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            >
                                <option value="">Select a colleague to appreciate</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullname} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Congratulations to John Doe"
                                required
                                maxLength={255}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#266ECD] focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#266ECD] focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Emoji Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Emoji
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {emojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                                        className={`text-3xl p-2 rounded-lg border-2 transition-all ${formData.emoji === emoji
                                                ? 'border-[#266ECD] bg-blue-50 dark:bg-gray-800'
                                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Write your appreciation message here..."
                                required
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#266ECD] focus:border-transparent outline-none resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formData.message.length} characters
                            </p>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#266ECD] text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Appreciation'}
                            </button>
                            <button
                                type="button"
                                onClick={onNavigateBack}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAppreciation;
