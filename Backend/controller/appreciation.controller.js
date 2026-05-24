import pool from "../db/db.js";
import {
    createAppreciation,
    getAllAppreciations,
    getAppreciationById,
    deleteAppreciation,
    likeAppreciation,
    unlikeAppreciation,
    checkUserLiked,
    addComment,
    deleteComment,
    getComments,
    getLeaderboard
} from "../models/appreciation.model.js";

// Create new appreciation
export const createAppreciationController = async (req, res) => {
    try {
        const { recipient_id, title, category, message, emoji, points, source } = req.body;
        const sender_id = req.user.id; // From auth middleware

        if (!recipient_id || !title || !category || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // If points are provided and > 0, perform transfer transactionally
        let transferResult = null;
        if (points && Number(points) > 0) {
            // Check if sender is admin - admins can grant unlimited points (no deduction)
            const { findUserById } = await import('../models/user.model.js');
            const { addPoints, transferPoints } = await import('../models/points.model.js');
            const sender = await findUserById(sender_id);

            try {
                if (sender && sender.role === 'Admin') {
                    // Admin grants points without deduction
                    const updatedRecipient = await addPoints(sender_id, recipient_id, Number(points), title || 'Points granted via admin appreciation');
                    transferResult = { sender: sender, recipient: updatedRecipient };
                } else {
                    // Normal user: perform atomic transfer (will fail if insufficient)
                    transferResult = await transferPoints(sender_id, recipient_id, Number(points), title || 'Points transfer via appreciation');
                }
            } catch (err) {
                console.error('Points transfer failed', err);
                return res.status(400).json({ success: false, message: err.message || 'Points transfer failed' });
            }
        }

        const appreciation = await createAppreciation(
            sender_id,
            recipient_id,
            title,
            category,
            message,
            points || 0,
            emoji || '🎉',
            source || 'feed'
        );

        // Emit activity update to client via event (frontend listens for activity:updated)
        try { global?.emitActivity?.('activity:updated'); } catch (e) {}

        res.status(201).json({
            success: true,
            message: "Appreciation created successfully",
            data: appreciation,
            transfer: transferResult
        });
    } catch (error) {
        console.error("Error creating appreciation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create appreciation",
            error: error.message
        });
    }
};

// Get all appreciations
export const getAllAppreciationsController = async (req, res) => {
    try {
        const { source } = req.query;
        const appreciations = await getAllAppreciations(source);

        // Add user liked status if user is authenticated
        if (req.user) {
            for (let appreciation of appreciations) {
                appreciation.user_liked = await checkUserLiked(req.user.id, appreciation.id);
            }
        }

        res.status(200).json({
            success: true,
            data: appreciations
        });
    } catch (error) {
        console.error("Error fetching appreciations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch appreciations",
            error: error.message
        });
    }
};

// Get single appreciation
export const getAppreciationByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const appreciation = await getAppreciationById(id);

        if (!appreciation) {
            return res.status(404).json({
                success: false,
                message: "Appreciation not found"
            });
        }

        // Add user liked status if user is authenticated
        if (req.user) {
            appreciation.user_liked = await checkUserLiked(req.user.id, appreciation.id);
        }

        res.status(200).json({
            success: true,
            data: appreciation
        });
    } catch (error) {
        console.error("Error fetching appreciation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch appreciation",
            error: error.message
        });
    }
};

// Delete appreciation
export const deleteAppreciationController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if appreciation exists and user is the creator
        const appreciation = await getAppreciationById(id);

        if (!appreciation) {
            return res.status(404).json({
                success: false,
                message: "Appreciation not found"
            });
        }

        // Allow deletion if the requester is the sender OR an Admin
        if (appreciation.sender_id !== userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this appreciation"
            });
        }

        await deleteAppreciation(id);

        res.status(200).json({
            success: true,
            message: "Appreciation deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting appreciation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete appreciation",
            error: error.message
        });
    }
};

// Toggle like on appreciation
export const toggleLikeController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if appreciation exists
        const appreciation = await getAppreciationById(id);
        if (!appreciation) {
            return res.status(404).json({
                success: false,
                message: "Appreciation not found"
            });
        }

        // Check if user already liked
        const hasLiked = await checkUserLiked(userId, id);

        if (hasLiked) {
            // Unlike
            await unlikeAppreciation(userId, id);
            return res.status(200).json({
                success: true,
                message: "Appreciation unliked",
                liked: false
            });
        } else {
            // Like
            await likeAppreciation(userId, id);
            return res.status(200).json({
                success: true,
                message: "Appreciation liked",
                liked: true
            });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle like",
            error: error.message
        });
    }
};

// Add comment to appreciation
export const addCommentController = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty"
            });
        }

        // Check if appreciation exists
        const appreciation = await getAppreciationById(id);
        if (!appreciation) {
            return res.status(404).json({
                success: false,
                message: "Appreciation not found"
            });
        }

        const newComment = await addComment(userId, id, comment);

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: newComment
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add comment",
            error: error.message
        });
    }
};

// Delete comment
export const deleteCommentController = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Get comment to check ownership
        const { rows } = await pool.query(
            "SELECT * FROM appreciation_comments WHERE id = $1",
            [commentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        if (rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this comment"
            });
        }

        await deleteComment(commentId);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete comment",
            error: error.message
        });
    }
};

// Get comments for appreciation
export const getCommentsController = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if appreciation exists
        const appreciation = await getAppreciationById(id);
        if (!appreciation) {
            return res.status(404).json({
                success: false,
                message: "Appreciation not found"
            });
        }

        const comments = await getComments(id);

        res.status(200).json({
            success: true,
            data: comments
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch comments",
            error: error.message
        });
    }
};

// Get leaderboard
export const getLeaderboardController = async (req, res) => {
    try {
        const leaderboard = await getLeaderboard();

        // Add rank
        const leaderboardWithRank = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1,
            points: Number(user.points) // Ensure points is a number
        }));

        res.status(200).json({
            success: true,
            data: leaderboardWithRank
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch leaderboard",
            error: error.message
        });
    }
};
