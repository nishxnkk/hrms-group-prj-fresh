import express from "express";
import { signup, login, logout, getAllUsers, getUserById, updateUser, addUser, deleteUser, getArchivedUsersController } from "../controller/user.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// ------------------- PUBLIC ROUTES -------------------
// Signup new user
router.post("/signup", signup);

// Login user
router.post("/login", login);

// upload profile endpoint (multipart/form-data)
router.post("/upload-profile", upload.single("profile"), (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ message: "No file uploaded" });
		const filePath = `/assets/uploads/${req.file.filename}`;
		res.status(201).json({ path: filePath });
	} catch (err) {
		console.error("Upload error", err);
		res.status(500).json({ message: "Upload failed" });
	}
});

// ------------------- PROTECTED ROUTES -------------------
// Logout user (must be logged in)
router.post("/logout", authenticate, logout);

// Get all users (Admin only likely, but route kept general as per main)
router.get("/", authenticate, getAllUsers);

// Admin: archived users (must come before param route '/:id')
router.get('/archived', authenticate, authorizeRoles("Admin"), getArchivedUsersController);

// Get user by ID
router.get("/:id", authenticate, getUserById);

// Update user (user can update only their own profile) - Includes profile picture upload
router.put("/:id", authenticate, upload.single('profile_picture'), updateUser);

// Admin: Add User
router.post("/add", authenticate, authorizeRoles("Admin"), addUser);

// Admin: Delete User
router.delete("/:id", authenticate, authorizeRoles("Admin"), deleteUser);

export default router;
