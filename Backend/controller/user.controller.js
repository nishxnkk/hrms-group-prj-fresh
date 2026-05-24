import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserById, findUserByUsername, getAllUsers as getAllUsersModel, archiveUserById, getArchivedUsers } from "../models/user.model.js";
import { createUserService, updateUserService } from "../services/user.service.js";
import { addToken } from "../models/blacklistedTokens.js";
import pool from "../db/db.js";

const makeUsername = (body) => {
    const source = body.username || (body.email ? body.email.split("@")[0] : body.fullname);
    return (source || "").toString().trim();
};

const normalizeUserPayload = (body) => ({
    ...body,
    username: makeUsername(body),
    date_of_joining: body.date_of_joining || null,
    designation: body.designation || '',
    job_title: body.job_title || '',
    department: body.department || '',
    phone: body.phone || '',
    employee_id: body.employee_id || '',
    profile_picture: body.profile_picture || '',
    status: body.status || 'ACTIVE',
    role: body.role || 'Employee',
    gender: body.gender || 'Not Specified',
});

/**
 * SIGNUP - Create a new user
 */
export const signup = async (req, res) => {
    try {
        const { fullname, username, email, password, designation, job_title, department, phone, date_of_joining, employee_id, profile_picture, status, role, gender } = normalizeUserPayload(req.body);

        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newUser = await createUserService(
            fullname,
            username,
            email,
            password,
            designation,
            job_title,
            department,
            phone,
            date_of_joining,
            employee_id,
            profile_picture,
            status,
            role || 'Employee',
            gender || 'Not Specified'
        );

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" }
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser.id,
                employee_id: newUser.employee_id,
                fullname: newUser.fullname,
                username: newUser.username,
                email: newUser.email,
                designation: newUser.designation,
                job_title: newUser.job_title,
                department: newUser.department,
                phone: newUser.phone,
                date_of_joining: newUser.date_of_joining,
                status: newUser.status,
                role: newUser.role,
                profile_picture: newUser.profile_picture,
                gender: newUser.gender,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error("❌ Signup Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * LOGIN - Authenticate a user
 */
export const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const loginName = (username || email || "").trim();

        if (!loginName || !password) return res.status(400).json({ message: "All fields are required" });

        const user = await findUserByUsername(loginName);
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                role: user.role,
                profile_picture: user.profile_picture,
                gender: user.gender
            }
        });
    } catch (error) {
        console.error("❌ Login Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * LOGOUT - Blacklist JWT token
 */
export const logout = async (req, res) => {
    try {
        const token = req.token;
        if (!token) return res.status(400).json({ message: "Token not provided" });

        await addToken(token);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("❌ Logout Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * GET ALL USERS - Admin only
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await getAllUsersModel();
        const now = new Date();
        // Derive status from admin-set status or last_activity timestamps
        const normalized = users.map(u => {
            const raw = (u.status || '').toString().trim().toUpperCase();
            // If admin explicitly set INACTIVE or RESIGNED, respect it (manual disabling / resignation)
            if (raw === 'INACTIVE' || raw === 'RESIGNED') return { ...u, status: raw, raw_status: raw };

            // If we have a live socket connection for this user, prefer that as ACTIVE
            let computed = 'UNKNOWN';
            try {
                if (global && global.onlineUsers && global.onlineUsers.has(String(u.id)) && raw !== 'INACTIVE') {
                    computed = 'ACTIVE';
                } else {
                    // Compute from last_activity if present, otherwise mark as INACTIVE
                    const last = u.last_activity ? new Date(u.last_activity) : null;
                    if (last) {
                        const diffSecs = Math.floor((now - last) / 1000);
                        // ACTIVE if within 30 seconds, IDLE if within 5 minutes, otherwise INACTIVE
                        if (diffSecs <= 30) {
                            computed = 'ACTIVE';
                        } else if (diffSecs <= 5 * 60) {
                            computed = 'IDLE';
                        } else {
                            computed = 'INACTIVE';
                        }
                    } else {
                        // No activity recorded -> treat as INACTIVE so offline users appear inactive
                        computed = 'INACTIVE';
                    }
                }
            } catch (e) {
                // Fallback to last_activity computation on error
                const last = u.last_activity ? new Date(u.last_activity) : null;
                if (last) {
                    const diffSecs = Math.floor((now - last) / 1000);
                    if (diffSecs <= 30) computed = 'ACTIVE';
                    else if (diffSecs <= 5 * 60) computed = 'IDLE';
                    else computed = 'INACTIVE';
                } else computed = 'INACTIVE';
            }

            return { ...u, status: computed, raw_status: raw || null };
        });

        res.status(200).json({
            success: true,
            users: normalized
        });
    } catch (error) {
        console.error("❌ Get All Users Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// heartbeat endpoint to update current user's last_activity
export const heartbeat = async (req, res) => {
    try {
        const uid = req.user && req.user.id;
        if (!uid) return res.status(401).json({ message: 'Unauthorized' });

        // Load user first so we can respect a Resigned status
        const user = await findUserById(uid);
        const status = user && user.status ? user.status.toString().trim().toUpperCase() : null;

        if (status === 'RESIGNED') {
            // Don't update last_activity for resigned users; just emit resigned
            try {
                if (global.io) {
                    global.io.emit('presence:update', { userId: String(uid), status: 'RESIGNED', last_activity: user.resigned_at || null });
                }
            } catch (e) {
                console.warn('Failed to emit presence update for resigned user', e);
            }
            return res.json({ ok: true, resigned: true });
        }

        // Not resigned — update last_activity and emit active
        try {
            console.debug('Heartbeat: updating last_activity for uid=', uid);
            await pool.query('UPDATE users SET last_activity = NOW() WHERE id = $1', [uid]);
        } catch (dbErr) {
            console.error('Heartbeat DB update failed for uid=', uid, dbErr);
            throw dbErr;
        }
        try {
            if (global.io) {
                global.io.emit('presence:update', { userId: String(uid), status: 'ACTIVE', last_activity: new Date().toISOString() });
            }
        } catch (e) {
            console.warn('Failed to emit presence update', e);
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('Heartbeat error', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await findUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // remove sensitive fields
        const { password, ...rest } = user;
        res.status(200).json({ user: rest });
    } catch (error) {
        console.error("❌ Get User By ID Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // only allow users to update their own profile OR Admins
        const isSelf = req.user && String(req.user.id) === String(id);
        const isAdmin = req.user && req.user.role === 'Admin'; // Assuming req.user is populated with role

        // Allow admins to update other users as well as users updating themselves
        // We might not have role in req.user yet depending on middleware. 
        // For now, allow update if it's the user themselves or an Admin.
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const updates = req.body || {};

        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            updates.profile_picture = `${protocol}://${host}/assets/uploads/${req.file.filename}`;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No updates provided" });
        }

        // If status is set to Resigned, archive and delete user
        if (updates.status && updates.status.toString().trim().toUpperCase() === 'RESIGNED') {
            const reason = updates.resignation_reason || null;
            try {
                const archived = await archiveUserById(id, reason, req.user ? req.user.id : null);
                // Ensure presence map clears this user
                if (global && global.onlineUsers) global.onlineUsers.delete(String(id));
                if (global && global.io) global.io.emit('presence:update', { userId: String(id), status: 'RESIGNED', last_activity: archived.resigned_at || null });
                // If it's self resign, blacklist token to force logout
                const isSelf = req.user && String(req.user.id) === String(id);
                if (isSelf && req.token) {
                    try { await addToken(req.token); } catch (e) { console.warn('Failed to blacklist token after resignation', e); }
                }
                return res.status(200).json({ message: 'User archived', archived });
            } catch (err) {
                console.error('Failed to archive user', err);
                return res.status(500).json({ message: 'Failed to archive user' });
            }
        }

        const updatedUser = await updateUserService(id, updates);
        // If status was updated, broadcast to connected clients
        if (updates.status && global && global.io) {
            try {
                global.io.emit('presence:update', { userId: String(updatedUser.id), status: updatedUser.status, last_activity: updatedUser.last_activity || null });
                // If user was marked as resigned, remove them from onlineUsers map so presence won't flip back on refresh
                if (updatedUser.status && updatedUser.status.toString().trim().toUpperCase() === 'RESIGNED' && global.onlineUsers) {
                    global.onlineUsers.delete(String(updatedUser.id));
                }
            } catch (e) {
                console.warn('Failed to emit status update', e);
            }
        }
        res.status(200).json({ message: "User updated", user: updatedUser });
    } catch (error) {
        console.error("❌ Update User Error:", error.message);
        if (error.message === "Email already in use" || error.message === "Username already in use") {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === "User not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Admin: Add User
export const addUser = async (req, res) => {
    try {
        // Basic check for admin (middleware should handle this better but for safety)
        // const requester = await findUserById(req.userId); 
        // if (requester.role !== 'Admin') return res.status(403).json({ message: "Access denied" });

        const { fullname, username, email, password, designation, job_title, department, phone, date_of_joining, employee_id, profile_picture, status, role, gender } = normalizeUserPayload(req.body);

        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newUser = await createUserService(
            fullname,
            username,
            email,
            password,
            designation,
            job_title,
            department,
            phone,
            date_of_joining,
            employee_id,
            profile_picture,
            status,
            role || 'Employee',
            gender || 'Not Specified'
        );

        res.status(201).json({
            message: "User created successfully",
            user: newUser
        });
    } catch (error) {
        console.error("❌ Add User Error:", error.message);
        if (error.message === "User already exists" || error.message === "Username already exists") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Archived users list (admin only)
export const getArchivedUsersController = async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'Admin';
        if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });
        const rows = await getArchivedUsers();
        res.status(200).json({ success: true, archived: rows });
    } catch (err) {
        console.error('Failed to fetch archived users', err);
        res.status(500).json({ message: 'Failed to fetch archived users' });
    }
};

// Admin: Delete User
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const query = "DELETE FROM users WHERE id = $1 RETURNING id";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("❌ Delete User Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
