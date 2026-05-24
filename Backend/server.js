import http from "http"; // server configuration
import app from "./app.js";
import "./db/db.js";
import { createUserTable } from "./models/user.model.js";
import { createBlacklistTable } from "./models/blacklistedTokens.js";
import {
    createAppreciationsTable,
    createLikesTable,
    createCommentsTable
} from "./models/appreciation.model.js";
import {
    createEmployeeOfMonthTable,
    createEmployeeOfMonthTeamTable
} from "./models/employeeOfMonth.model.js";

import { createMessagesTable, createMessage, getMessages, getRecentConversations } from "./models/message.model.js";

import { createJobsTable } from "./models/job.model.js";
import { createApplicationsTable } from "./models/application.model.js";
import { createOffersTable } from "./models/offer.model.js";
import { createPayrollTable } from "./models/payroll.model.js";
import { createHrModuleTable } from "./models/hrModule.model.js";
import { createInterviewsTable } from "./models/interview.model.js";
import { createEventTable } from "./models/event.model.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { heartbeat } from "./controller/user.controller.js";

import { Server } from "socket.io";
import dotenv from "dotenv";
import net from "net";

dotenv.config();

const port = process.env.PORT || 3000;
const MAX_PORT_ATTEMPTS = process.env.NODE_ENV === "production" ? 1 : 10;

const server = http.createServer(app);

// Initialize Socket.io (CORS configured to allow frontend origin and local dev)
const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOrigins = [...new Set([...configuredOrigins, 'http://localhost:5173'])];
const io = new Server(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// Expose on global so other modules (controllers) can emit events without circular imports
global.io = io;

const onlineUsers = new Map(); // Store online users: userId -> socketId
// Also expose onlineUsers map so controllers can read it when deriving status
global.onlineUsers = onlineUsers;

import pool from './db/db.js';

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Handle user login/online status
    socket.on("user_connected", async (userId) => {
        const idStr = String(userId); // Force string for consistency
        onlineUsers.set(idStr, socket.id);
        io.emit("online_users", Array.from(onlineUsers.keys()));

        // Update DB last_activity and check user status so we don't mark resigned users active
        try {
            await pool.query('UPDATE users SET last_activity = NOW() WHERE id = $1', [idStr]);
            const { rows } = await pool.query('SELECT status, last_activity, resigned_at FROM users WHERE id = $1', [idStr]);
            const row = rows[0] || {};
            const status = row.status ? row.status.toString().trim().toUpperCase() : null;
            const last = row.last_activity ? new Date(row.last_activity).toISOString() : new Date().toISOString();

            if (status === 'RESIGNED' || status === 'INACTIVE') {
                // If user is manually disabled/resigned, keep them out of online presence.
                onlineUsers.delete(idStr);
                io.emit("online_users", Array.from(onlineUsers.keys()));
                const resignedAtIso = row.resigned_at ? new Date(row.resigned_at).toISOString() : null;
                io.emit('presence:update', {
                    userId: idStr,
                    status,
                    last_activity: status === 'RESIGNED' ? resignedAtIso : row.last_activity || null
                });
                if (process.env.NODE_ENV !== 'test') console.log(`User ${idStr} attempted connect but is ${status}.`);
            } else {
                io.emit('presence:update', { userId: idStr, status: 'ACTIVE', last_activity: last });
                if (process.env.NODE_ENV !== 'test') console.log(`User ${idStr} is online. Total online: ${onlineUsers.size}`);
            }
        } catch (err) {
            console.warn('Failed to update last_activity on connect', err);
            io.emit('presence:update', { userId: idStr, status: 'ACTIVE', last_activity: new Date().toISOString() });
        }
    });

    // Handle idle notification (client became idle)
    socket.on('user_idle', (userId) => {
        try {
            const idStr = String(userId);
            // Broadcast IDLE state immediately; don't update DB so last_activity remains last active time
            io.emit('presence:update', { userId: idStr, status: 'IDLE', last_activity: null });
            if (process.env.NODE_ENV !== 'test') console.log(`User ${idStr} is idle.`);
        } catch (e) {
            console.warn('Error handling user_idle', e);
        }
    });

    // Handle client reporting it became active again (e.g., user moved mouse)
    socket.on('user_active', async (userId) => {
        try {
            const idStr = String(userId);
                // ensure they are marked online and update DB if not resigned
            const { rows: statusRows } = await pool.query('SELECT status FROM users WHERE id = $1', [idStr]);
            const status = statusRows[0] && statusRows[0].status ? statusRows[0].status.toString().trim().toUpperCase() : null;
            if (status === 'RESIGNED' || status === 'INACTIVE') {
                // If manually disabled/resigned, remove from online users map and broadcast status.
                onlineUsers.delete(idStr);
                io.emit("online_users", Array.from(onlineUsers.keys()));
                const { rows: r } = await pool.query('SELECT resigned_at FROM users WHERE id = $1', [idStr]);
                const resignedAtIso = r[0] && r[0].resigned_at ? new Date(r[0].resigned_at).toISOString() : null;
                io.emit('presence:update', {
                    userId: idStr,
                    status,
                    last_activity: status === 'RESIGNED' ? resignedAtIso : null
                });
                if (process.env.NODE_ENV !== 'test') console.log(`User ${idStr} attempted to become active but is ${status}.`);
            } else {
                onlineUsers.set(idStr, socket.id);
                io.emit("online_users", Array.from(onlineUsers.keys()));
                // Update DB last_activity to NOW to reflect immediate activity
                await pool.query('UPDATE users SET last_activity = NOW() WHERE id = $1', [idStr]);
                const { rows } = await pool.query('SELECT last_activity FROM users WHERE id = $1', [idStr]);
                const last = rows[0] && rows[0].last_activity ? new Date(rows[0].last_activity).toISOString() : new Date().toISOString();
                io.emit('presence:update', { userId: idStr, status: 'ACTIVE', last_activity: last });
                if (process.env.NODE_ENV !== 'test') console.log(`User ${idStr} became active (user_active).`);
            }
        } catch (err) {
            console.warn('Failed to handle user_active', err);
        }
    });

    // Handle disconnects and mark users offline immediately
    socket.on('disconnect', () => {
        // Find any userIds mapped to this socket and remove them
        for (const [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                io.emit("online_users", Array.from(onlineUsers.keys()));
                io.emit('presence:update', { userId: uid, status: 'INACTIVE', last_activity: null });
                if (process.env.NODE_ENV !== 'test') console.log(`User ${uid} disconnected. Total online: ${onlineUsers.size}`);
            }
        }
    });

    // Join a chat room (optional, for direct messages)
    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
    });

    // Handle sending messages
    socket.on("send_message", async (data) => {
        console.log("📨 Server: send_message received. Data:", JSON.stringify(data, null, 2));
        // Data expected: { senderId, receiverId, message, room, id (tempId) }

        // Save to DB
        try {
            if (data.senderId && data.receiverId) {
                const savedMsg = await createMessage(data.senderId, data.receiverId, data.message);

                // Normalize created_at to ISO (UTC) so clients can reliably convert to local time
                const createdAtIso = savedMsg.created_at ? new Date(savedMsg.created_at).toISOString() : new Date().toISOString();

                // Ack to Sender with Real ID and ISO timestamp
                socket.emit("message_sent", { tempId: data.id, id: savedMsg.id, created_at: createdAtIso });
                console.log(`📤 Server: Emitted message_sent to sender. TempID: ${data.id}, RealID: ${savedMsg.id}`);

                data.id = savedMsg.id; // Add DB id to data
                data.created_at = createdAtIso;
            }
        } catch (err) {
            console.error("Error saving message:", err);
        }

        // Broadcast the message to everyone (simplest for now) or specific room
        // socket.broadcast.emit("receive_message", data);

        // BETTER: Send only to receiver
        const receiverSocketId = onlineUsers.get(String(data.receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", { ...data, status: 'sent' });
        }
    });

    socket.on("message_delivered", async (data) => {
        console.log("🔔 Server: Received message_delivered:", data);
        // data: { messageId, senderId }
        const { updateMessageStatus } = await import('./models/message.model.js');
        if (data.messageId) await updateMessageStatus(data.messageId, 'delivered');

        const senderSocketId = onlineUsers.get(String(data.senderId));
        console.log(`🔍 Looking for sender ${data.senderId}. Socket ID: ${senderSocketId}`);

        if (senderSocketId) {
            io.to(senderSocketId).emit("message_status_update", { id: data.messageId, status: 'delivered' });
            console.log(`📤 Emitted message_status_update (delivered) to ${data.senderId}`);
        } else {
            console.warn(`⚠️ Sender ${data.senderId} not found in onlineUsers`);
        }
    });

    socket.on("message_read", async (data) => {
        console.log("🔔 Server: Received message_read:", data);
        // data: { messageId, senderId }
        const { updateMessageStatus } = await import('./models/message.model.js');
        if (data.messageId) await updateMessageStatus(data.messageId, 'read');

        const senderSocketId = onlineUsers.get(String(data.senderId));
        if (senderSocketId) {
            io.to(senderSocketId).emit("message_status_update", { id: data.messageId, status: 'read' });
            console.log(`📤 Emitted message_status_update (read) to ${data.senderId}`);
        }
    });

    socket.on("edit_message", async (data) => {
        // data: { id, text, receiverId }
        const receiverSocketId = onlineUsers.get(String(data.receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("message_updated", { id: data.id, text: data.text });
        }
    });

    socket.on("delete_message", async (data) => {
        // data: { id, receiverId }
        const receiverSocketId = onlineUsers.get(String(data.receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("message_deleted", { id: data.id });
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        // Remove user from onlineUsers map efficiently
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit("online_users", Array.from(onlineUsers.keys()));
                console.log(`User ${userId} went offline.`);
                break;
            }
        }
    });
});

import { createMeeting, createMeetingTable, deleteMeeting, getMeetings, updateMeeting } from "./models/meeting.model.js";
import { updateUserProfile } from "./models/user.model.js";
import { createTasksTable } from "./models/task.model.js";
import {
  createTaskController,
  getTasksController,
  updateTaskController,
  deleteTaskController,
  getTasksSummaryController
} from "./controller/task.controller.js";

// ... existing imports ...

// API to get Chat History
app.get("/api/messages/:user1/:user2", async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        const messages = await getMessages(user1, user2);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// API for Message Actions (Edit/Delete)
app.put("/api/messages/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const { editMessage } = await import('./models/message.model.js');
        const updated = await editMessage(id, message);
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to edit message" });
    }
});

app.delete("/api/messages/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteMessage } = await import('./models/message.model.js');
        const deleted = await deleteMessage(id);
        res.json(deleted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete message" });
    }
});

// API to get Recent Conversations
app.get("/api/chats/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const recent = await getRecentConversations(userId);
        res.json(recent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch recent chats" });
    }
});

// --- MEETINGS API ---
app.get("/api/meetings", async (req, res) => {
    try {
        const meetings = await getMeetings();
        res.json(meetings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});

app.post("/api/meetings", async (req, res) => {
    try {
        const { title, description = "", meeting_date, start_time, end_time } = req.body;
        const newMeeting = await createMeeting({ title, description, meeting_date, start_time, end_time });
        res.status(201).json(newMeeting);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

app.put("/api/meetings/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description = "", meeting_date, start_time, end_time } = req.body;
        const updated = await updateMeeting(id, { title, description, meeting_date, start_time, end_time });
        if (!updated) return res.status(404).json({ error: "Meeting not found" });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update meeting" });
    }
});

app.delete("/api/meetings/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await deleteMeeting(id);
        res.json({ message: "Meeting deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete meeting" });
    }
});

// --- TASKS API ---
app.post("/api/tasks", authMiddleware, async (req, res) => {
    // create task (admin only)
    return await createTaskController(req, res);
});

app.get("/api/tasks", authMiddleware, async (req, res) => {
    // get tasks (admin sees all, regular users see assigned tasks)
    return await getTasksController(req, res);
});

app.put("/api/tasks/:id", authMiddleware, async (req, res) => {
    return await updateTaskController(req, res);
});

app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
    return await deleteTaskController(req, res);
});

app.get('/api/tasks/summary', authMiddleware, async (req, res) => {
  return await getTasksSummaryController(req, res);
});

// Update Profile API
app.put("/api/users/profile/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { fullname, email, designation, profile_picture, gender } = req.body;

        // Basic validation
        if (!fullname || !email) {
            return res.status(400).json({ error: "Name and Email are required" });
        }

        const updatedUser = await updateUserProfile(id, fullname, email, designation, profile_picture, gender);

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return updated user without password
        delete updatedUser.password;
        res.json(updatedUser);
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Heartbeat endpoint (user presence)
app.post('/api/users/heartbeat', authMiddleware, async (req, res) => {
  try {
    return await heartbeat(req, res);
  } catch (err) {
    console.error('Heartbeat route error', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// --------------------

// Initialize database tables
const initDb = async () => {
    await createUserTable();
    await createBlacklistTable();
    await createAppreciationsTable();
    await createLikesTable();
    await createCommentsTable();
    await createEmployeeOfMonthTable();
    await createEmployeeOfMonthTeamTable();
    await createJobsTable();
    await createApplicationsTable();
    await createInterviewsTable();
    await createOffersTable();
    await createPayrollTable();
    await createHrModuleTable();
    await createMessagesTable();
    await createMeetingTable();
    await createTasksTable();
    // create points table
    try {
        const { createPointsTable } = await import('./models/points.model.js');
        await createPointsTable();
    } catch (err) {
        console.error('Error creating points table', err);
    }

    // create redemption tables
    try {
        const { createRedemptionTables } = await import('./models/redemption.model.js');
        await createRedemptionTables();
    } catch (err) {
        console.error('Error creating redemption tables', err);
    }

    // create promotions tables
    try {
        const { createPromotionsTable } = await import('./models/promotion.model.js');
        await createPromotionsTable();
    } catch (err) {
        console.error('Error creating promotions tables', err);
    }

    await createEventTable(); // Create events and event_attendees tables

    // create dashboard stats table
    try {
        const { createDashboardStatsTable } = await import('./models/dashboard.model.js');
        await createDashboardStatsTable();
    } catch (err) {
        console.error('Error creating dashboard stats table', err);
    }
};

initDb();

const startServer = async () => {
    const preferred = parseInt(port, 10);

    for (let p = preferred; p < preferred + MAX_PORT_ATTEMPTS; p++) {
        try {
            await new Promise((resolve, reject) => {
                const onListening = () => {
                    server.off('error', onError);
                    resolve();
                };
                const onError = (err) => {
                    server.off('listening', onListening);
                    reject(err);
                };
                server.once('listening', onListening);
                server.once('error', onError);
                server.listen(p);
            });

            console.log(`Server is running on port ${p}`);
            return;
        } catch (err) {
            if (err && err.code === 'EADDRINUSE') {
                console.warn(`Port ${p} is in use, trying next port...`);
                continue;
            } else {
                console.error('Error while trying to listen on port', p, err);
                process.exit(1);
            }
        }
    }

    console.error(`No available ports found in range ${preferred}-${preferred + MAX_PORT_ATTEMPTS - 1}.`);
    process.exit(1);
};

server.on('error', (err) => {
    console.error('Server error:', err);
});

startServer().catch(err => {
    console.error('Failed to start server', err);
    process.exit(1);
});
