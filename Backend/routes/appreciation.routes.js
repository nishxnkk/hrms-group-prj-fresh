import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    createAppreciationController,
    getAllAppreciationsController,
    getAppreciationByIdController,
    deleteAppreciationController,
    toggleLikeController,
    addCommentController,
    deleteCommentController,
    getCommentsController,
    getLeaderboardController
} from "../controller/appreciation.controller.js";

const router = express.Router();

// Appreciation routes
router.get("/leaderboard", getLeaderboardController);
router.post("/", authenticate, createAppreciationController);
router.get("/", getAllAppreciationsController);
router.get("/:id", getAppreciationByIdController);
router.delete("/:id", authenticate, deleteAppreciationController);

// Like routes
router.post("/:id/like", authenticate, toggleLikeController);

// Comment routes
router.post("/:id/comments", authenticate, addCommentController);
router.get("/:id/comments", getCommentsController);
router.delete("/:id/comments/:commentId", authenticate, deleteCommentController);

export default router;
