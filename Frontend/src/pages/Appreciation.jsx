import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getAppreciationById,
  addComment,
  getComments,
  deleteComment,
  toggleLike
} from '../services/appreciationService';

const AppreciationPage = () => {
  const { id } = useParams();
  const [appreciation, setAppreciation] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAppreciation = async () => {
    try {
      const data = await getAppreciationById(id);
      setAppreciation(data);
    } catch (err) {
      console.error('Failed to load appreciation', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await getComments(id);
      if (res && res.data) setComments(res.data);
      else if (Array.isArray(res)) setComments(res);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  useEffect(() => {
    fetchAppreciation();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(id, newComment);
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id, commentId);
      fetchComments();
    } catch (err) {
      console.error('Failed to delete comment', err);
      alert('Failed to delete comment');
    }
  };

  const handleToggleLike = async () => {
    try {
      await toggleLike(id);
      fetchAppreciation();
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!appreciation) return <div className="p-6">Appreciation not found.</div>;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-[#266ECD] flex items-center justify-center font-bold text-xl">
            {appreciation.sender_name ? appreciation.sender_name[0] : 'A'}
          </div>
          <div className="flex-1">
            <p className="text-gray-900 dark:text-white">
              <span className="font-bold text-[#266ECD]">{appreciation.sender_name}</span> appreciated <span className="font-bold text-[#266ECD]">{appreciation.recipient_name}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(appreciation.created_at).toLocaleString()}</p>
            <p className="mt-4 text-gray-800 dark:text-gray-100">{appreciation.message}</p>
            <div className="mt-4 flex gap-2 items-center">
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded">#{appreciation.category}</span>
              <span>{appreciation.emoji}</span>
              <button onClick={handleToggleLike} className="ml-auto text-sm text-gray-600 dark:text-gray-300">
                {appreciation.likes_count || 0} Likes
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Comments</h3>

          <div className="mt-2 p-4 bg-gray-800 rounded-lg text-white">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-lg outline-none bg-gray-700 text-white border border-gray-600 placeholder-gray-400"
                onKeyPress={(e) => { if (e.key === 'Enter') handlePost(); }}
              />
              <button onClick={handlePost} className="bg-[#266ECD] text-white px-4 py-2 rounded-lg font-semibold">Post</button>
            </div>

            <div className="space-y-3">
              {comments.length === 0 && <p className="text-sm text-gray-300 text-center py-4">No comments yet. Be the first to comment!</p>}
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-700 rounded-lg p-3 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{c.user_name}</p>
                      <p className="text-sm text-gray-200 mt-1">{c.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <button onClick={() => handleDeleteComment(c.id)} className="text-sm text-red-400">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppreciationPage;
