import React, { useState, useEffect } from 'react'
import io from "socket.io-client";
import axios from "axios";
import { Search, MoreVertical, Send, Phone, Video, Info, ArrowLeft, Clock, Check, CheckCheck, Trash2, Edit2, MoreHorizontal } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const socket = io.connect(API_BASE);

const Chat = () => {
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get('userId');

  const [recentChats, setRecentChats] = useState([]); // Recent conversations
  const [allUsers, setAllUsers] = useState([]); // All users for search
  const [displayedContacts, setDisplayedContacts] = useState([]); // What is actually shown
  const [searchQuery, setSearchQuery] = useState(""); // Search input state
  const [loading, setLoading] = useState(true); // Loading state
  const [onlineUserIds, setOnlineUserIds] = useState(new Set()); // Track online users

  // User & Selection State
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputMessage, setInputMessage] = useState('')
  const [chatListOpen, setChatListOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState(null);

  // Helper: robust time formatting (handles ISO and DB strings and converts to local time)
  const formatTime = (isoOrDate) => {
    try {
      if (!isoOrDate) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // If it's already a Date instance, use it
      if (isoOrDate instanceof Date) {
        return isoOrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let s = String(isoOrDate).trim();

      // If it is a simple 'HH:MM AM/PM' string coming from client, return as-is (but normalized)
      if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(s)) {
        // Make sure to uppercase AM/PM and pad hour
        return s.toUpperCase();
      }

      // Detect ISO with timezone or offset
      const hasTZ = /[Zz]|[+\-]\d{2}:?\d{2}/.test(s);
      const hasT = s.includes('T');

      let d;

      // DB common formats:
      // 1) 'YYYY-MM-DD HH:mm:ss' -> treat as local time (no timezone)
      // 2) 'YYYY-MM-DDTHH:mm:ss' (no TZ) -> treat as local time
      // 3) ISO with Z or offset -> use Date(s)

      const dbSpaceFormat = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?/;
      const isoNoTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

      if (hasTZ) {
        d = new Date(s);
      } else if (dbSpaceFormat.test(s) || isoNoTZ.test(s)) {
        // Parse as local time exactly (do not append Z)
        // Extract components
        const parts = s.replace('T', ' ').split(' ');
        const dateParts = parts[0].split('-');
        const timeParts = (parts[1] || '').split(':');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const hour = parseInt(timeParts[0] || '0', 10);
        const minute = parseInt(timeParts[1] || '0', 10);
        const second = parseInt(timeParts[2] || '0', 10);
        d = new Date(year, month, day, hour, minute, second);
      } else if (hasT) {
        // fallback parse
        d = new Date(s);
      } else {
        // For any other string, fallback to Date
        d = new Date(s);
      }

      if (isNaN(d.getTime())) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Conversation state
  const [conversation, setConversation] = useState([]);

  // --- 1. INITIAL DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        // Parse User
        let currentUserId = null;
        if (userStr) {
          const parsed = JSON.parse(userStr);
          setCurrentUser(parsed);
          currentUserId = parsed.id;
        }

        if (!token || !currentUserId) {
          setLoading(false);
          return;
        }

        // Notify server we are online
        socket.emit("user_connected", currentUserId);

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // A. Fetch Recent Chats (Primary List)
        try {
          const recentRes = await axios.get(`${API_BASE}/api/chats/${currentUserId}`, config);
          const recent = recentRes.data.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            message: user.message,
            time: user.time ? formatTime(user.time) : "",
            avatar: user.name ? user.name.charAt(0).toUpperCase() : "?",
            unread: false, // You might want real unread count from DB later
            isRecent: true
          }));
          setRecentChats(recent);
          if (recent.length > 0) setSelectedChat(recent[0].id);
        } catch (error) {
          console.error("Error fetching recent chats:", error);
        }

        // B. Fetch All Users (Directory for Search)
        try {
          const usersRes = await axios.get(`${API_BASE}/api/users`, config);
          const all = (usersRes.data.users || [])
            .filter(u => u.id !== currentUserId)
            .map(user => ({
              id: user.id,
              name: user.fullname,
              role: user.email,
              message: "Start a new conversation",
              time: "",
              avatar: user.fullname ? user.fullname.charAt(0).toUpperCase() : "?",
              unread: false,
              isRecent: false
            }));
          setAllUsers(all);
          // If page was opened with ?userId=... select that chat automatically
          if (requestedUserId) {
            setSelectedChat(requestedUserId);
            setChatListOpen(false);
          }
        } catch (err) {
          if (err.response && err.response.status === 401) {
            if (err.response.data && err.response.data.message === "Token expired") {
              alert("Session expired. Please log in again.");
            }
            // Token invalid/expired - force logout
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          console.error("Error fetching users for chat:", err);
        }

      } catch (err) {
        console.error("Failed to load chat data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. ONLINE PRESENCE LISTENER & RECONNECTION ---
  useEffect(() => {
    // 1. Listen for the list of online users
    const handleOnlineUsers = (userIds) => {
      // Force all IDs to strings for consistent checking
      const idSet = new Set(userIds.map(id => String(id)));
      setOnlineUserIds(idSet);
    };

    socket.on("online_users", handleOnlineUsers);

    // 2. Handle Reconnection (Important if server restarts)
    const handleConnect = () => {
      if (currentUser && currentUser.id) {
        console.log("Reconnected to server, sending identity:", currentUser.id);
        socket.emit("user_connected", currentUser.id);
      }
    };

    socket.on("connect", handleConnect);

    // 3. Emit immediately if we already have a user and socket is connected
    if (currentUser && currentUser.id && socket.connected) {
      socket.emit("user_connected", currentUser.id);
    }

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("connect", handleConnect);
    };
  }, [currentUser]); // Re-run if user changes

  // --- 3. FILTERING & DISPLAY LOGIC ---
  useEffect(() => {
    let sourceList = [];

    if (!searchQuery.trim()) {
      // Default View: Show Recent Chats ONLY
      // If no recent chats, show directory (UX choice)
      sourceList = recentChats.length > 0 ? recentChats : allUsers;
    } else {
      // Search View: Search across ALL users (Directory)
      sourceList = allUsers;
    }

    // Apply presence status to whatever list we are showing
    const listWithStatus = sourceList.map(contact => ({
      ...contact,
      status: onlineUserIds.has(String(contact.id)) ? "online" : "offline"
    }));

    // Filter by Query if it exists
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = listWithStatus.filter(c =>
        (c.name && c.name.toLowerCase().includes(lowerQuery)) ||
        (c.role && c.role.toLowerCase().includes(lowerQuery))
      );
      setDisplayedContacts(filtered);
    } else {
      setDisplayedContacts(listWithStatus);
    }

  }, [searchQuery, recentChats, allUsers, onlineUserIds]);

  // If a chat was requested via query param but that user is not in our lists, fetch them
  useEffect(() => {
    const addRequestedUser = async () => {
      if (!requestedUserId) return;
      const exists = allUsers.find(u => String(u.id) === String(requestedUserId)) || recentChats.find(r => String(r.id) === String(requestedUserId));
      if (exists) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/users/${requestedUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const u = data.user;
        if (u) {
          setAllUsers(prev => [...prev, { id: u.id, name: u.fullname, role: u.email, message: 'Start a new conversation', time: '', avatar: u.fullname ? u.fullname.charAt(0).toUpperCase() : '?' }]);
        }
      } catch (err) {
        console.error('Failed to fetch requested chat user', err);
      }
    };
    addRequestedUser();
  }, [requestedUserId, allUsers, recentChats]);


  // --- 4. REAL-TIME MESSAGING LOGIC ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedChat || !currentUser) return;

      // Mark local as read
      setRecentChats(prev => prev.map(c => c.id === selectedChat ? { ...c, unread: false } : c));

      try {
        const res = await axios.get(`${API_BASE}/api/messages/${currentUser.id}/${selectedChat}`);
        const history = res.data.map(msg => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender_id === currentUser.id ? "me" : "other",
          time: formatTime(msg.created_at),
          status: msg.status,
          is_edited: msg.is_edited,
          is_deleted: msg.is_deleted
        }));
        setConversation(history);

        // Mark last message from OTHER as read if it isn't already
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.sender === 'other' && lastMsg.status !== 'read') {
          socket.emit("message_read", { messageId: lastMsg.id, senderId: selectedChat });
        }

      } catch (err) { console.error("Error loading history", err); }
    };
    fetchHistory();
  }, [selectedChat, currentUser]);

  const selectedChatData = displayedContacts.find(m => m.id === selectedChat) || allUsers.find(u => u.id === selectedChat);
  // Enhance selected data with current online status
  const activeChatUser = selectedChatData ? {
    ...selectedChatData,
    status: onlineUserIds.has(String(selectedChatData.id)) ? "online" : "offline"
  } : null;

  // Listen for incoming messages

  // Listen for incoming messages
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      console.log("📥 Chat: Received Message:", data);

      // DEBUG: Log emission
      if (data.id) console.log("📤 Emitting message_delivered for:", data.id);
      else console.warn("⚠️ Received message without ID, cannot emit delivered");

      // Update active conversation if applicable
      const isChattingWithSender =
        String(data.senderId) === String(selectedChat) &&
        String(data.receiverId) === String(currentUser?.id);

      const isChattingWithReceiver =
        String(data.senderId) === String(currentUser?.id) &&
        String(data.receiverId) === String(selectedChat);

      if (isChattingWithSender || isChattingWithReceiver) {
        setConversation((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            text: data.message,
            sender: String(data.senderId) === String(currentUser?.id) ? "me" : "other",
            time: formatTime(data.created_at),
            status: "read", // We are watching it now, so it's read
          },
        ]);
        if (data.id) socket.emit("message_read", { messageId: data.id, senderId: data.senderId });
      }

      // Always mark as delivered
      if (data.id) socket.emit("message_delivered", { messageId: data.id, senderId: data.senderId });

      // Toast notification
      if (
        String(data.receiverId) === String(currentUser?.id) &&
        String(data.senderId) !== String(currentUser?.id)
      ) {
        toast.success(`New message from ${data.author || "User " + data.senderId}`, {
          icon: "💬",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }

      // Update Sidebar List (Reorder & Unread)
      setRecentChats((prev) => {
        const senderId =
          String(data.senderId) === String(currentUser?.id) ? data.receiverId : data.senderId;
        const senderIndex = prev.findIndex((c) => String(c.id) === String(senderId));

        let updatedContacts = [...prev];
        let sender;

        if (senderIndex !== -1) {
          [sender] = updatedContacts.splice(senderIndex, 1);
        } else {
          const userDetails = allUsers.find((u) => String(u.id) === String(senderId));
          if (!userDetails) {
            console.warn(`Sender ${senderId} not found in allUsers directory. Using fallback.`);
            sender = {
              id: senderId,
              name: "New Contact",
              avatar: "?",
              role: "Employee",
              status: "online",
              isRecent: true,
              unread: false,
            };
          } else {
            sender = { ...userDetails, unread: false };
          }
        }

        const isUnread = String(senderId) !== String(selectedChat);

        updatedContacts.unshift({
          ...sender,
          unread: isUnread || sender.unread || false,
          message: data.message,
          time: formatTime(data.created_at),
        });

        return updatedContacts;
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedChat, currentUser, allUsers, formatTime]);

  // --- 5. NEW: Listeners for Status, Edit, Delete ---
  // Ref to store updates that arrive before the message ID is synced
  const pendingUpdates = React.useRef(new Map());

  // --- 5. NEW: Listeners for Status, Edit, Delete ---
  useEffect(() => {
    // Status update (delivered/read)
    const handleStatusUpdate = (data) => {
      console.log("📥 Chat: Status Update Received:", data);
      setConversation(prev => {
        const exists = prev.some(msg => msg.id === data.id);
        if (!exists) { // Message ID mismatch (still tempId?)
          console.log("⏳ Message not found yet (race condition?), caching update:", data.id, data.status);
          pendingUpdates.current.set(String(data.id), data.status);
          return prev;
        }
        return prev.map(msg =>
          msg.id === data.id ? { ...msg, status: data.status } : msg
        );
      });
    };

    const handleMessageUpdated = (data) => {
      setConversation(prev => prev.map(msg =>
        msg.id === data.id ? { ...msg, text: data.text, is_edited: true } : msg
      ));
    };

    const handleMessageDeleted = (data) => {
      setConversation(prev => prev.map(msg =>
        msg.id === data.id ? { ...msg, text: "This message was deleted", is_deleted: true } : msg
      ));
    };

    const handleMessageSent = (data) => {
      console.log("📥 Chat: Message Sent Confirmed:", data);

      setConversation(prev => prev.map(msg => {
        if (String(msg.id) === String(data.tempId)) {
          // Check if we have pending status updates for this ID
          const pendingStatus = pendingUpdates.current.get(String(data.id));
          if (pendingStatus) {
            console.log("🔄 Applying pending status update:", pendingStatus);
            pendingUpdates.current.delete(String(data.id));
            return { ...msg, id: data.id, status: pendingStatus, time: data.created_at ? formatTime(data.created_at) : msg.time };
          }
          return { ...msg, id: data.id, status: 'sent', time: data.created_at ? formatTime(data.created_at) : msg.time };
        }
        return msg;
      }));

      // Also update the sidebar/recent chats entry for the receiver so time matches DB
      if (data && data.receiverId) {
        setRecentChats(prev => {
          const idx = prev.findIndex(c => String(c.id) === String(data.receiverId));
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              time: data.created_at ? formatTime(data.created_at) : updated[idx].time
            };
            return updated;
          }
          return prev;
        });
      }
    };

    socket.on("message_status_update", handleStatusUpdate);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_sent", handleMessageSent);

    return () => {
      socket.off("message_status_update", handleStatusUpdate);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_sent", handleMessageSent);
    };
  }, []);

  const handleEditMessage = async (msgId, newText, receiverId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/api/messages/${msgId}`, { message: newText }, { headers: { Authorization: `Bearer ${token}` } });

      setConversation(prev => prev.map(m => m.id === msgId ? { ...m, text: newText, is_edited: true } : m));
      socket.emit("edit_message", { id: msgId, text: newText, receiverId });
      toast.success("Message edited");
    } catch (err) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (msgId, receiverId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/messages/${msgId}`, { headers: { Authorization: `Bearer ${token}` } });

      setConversation(prev => prev.map(m => m.id === msgId ? { ...m, text: "This message was deleted", is_deleted: true } : m));
      socket.emit("delete_message", { id: msgId, receiverId });
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };


  const handleSendMessage = async () => {
    if (inputMessage.trim() && currentUser && selectedChat) {
      const tempId = Date.now();
      const messageData = {
        id: tempId, // Send temp ID to server
        room: selectedChat,
        senderId: currentUser.id,
        receiverId: selectedChat,
        author: currentUser.fullname,
        message: inputMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      await socket.emit("send_message", messageData);

      setConversation(prev => [
        ...prev,
        { id: tempId, text: inputMessage, sender: "me", time: messageData.time, status: 'sending' }
      ]);

      // Optimistic Sidebar Update
      setRecentChats(prev => {
        const receiverIndex = prev.findIndex(c => c.id === selectedChat);
        let newList = [...prev];
        let receiver = null;

        if (receiverIndex !== -1) {
          [receiver] = newList.splice(receiverIndex, 1);
        } else {
          const found = allUsers.find(u => u.id === selectedChat);
          if (found) receiver = { ...found, isRecent: true };
        }

        if (receiver) {
          receiver = {
            ...receiver,
            message: "You: " + inputMessage,
            time: messageData.time,
            unread: false
          };
          newList.unshift(receiver);
        }
        return newList;
      });

      setInputMessage('');
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#0C1014] text-gray-900 dark:text-gray-100">
      {/* --- SIDEBAR --- */}
      <div className={`${chatListOpen ? 'block' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-gray-200 dark:border-[#1F2429] h-full`}>
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-[#1F2429] flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h2>
          <div className="flex gap-2">
            <button className="md:hidden p-2 text-gray-400 hover:bg-[#1F2429] rounded-full" onClick={() => setChatListOpen(false)}>
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-4 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#1F2429] border border-gray-200 dark:border-[#1F2429] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-gray-900 dark:text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {displayedContacts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-[#1F2429] rounded-full flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">No chats yet</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[150px]">Search for a colleague to start a conversation.</p>
                </div>
              )}
              {displayedContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => { setSelectedChat(contact.id); setChatListOpen(false); }}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${selectedChat === contact.id ? 'bg-blue-50 dark:bg-[#1F2429] border border-blue-100 dark:border-[#1F2429]' : 'hover:bg-gray-50 dark:hover:bg-[#1F2429] border border-transparent'}`}
                >
                  {/* Avatar + Status */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-linear-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm shadow-sm">
                      {contact.avatar}
                    </div>
                    {/* Status Dot */}
                    <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0C1014] ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm truncate ${contact.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
                        {contact.name}
                      </h3>
                      {contact.time && <span className="text-[10px] text-gray-500 font-medium shrink-0 ml-2">{contact.time}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate max-w-40 ${contact.unread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
                        {contact.message || contact.role}
                      </p>
                      {contact.unread && (
                        <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>


      {/* --- MESSAGING AREA --- */}
      <div className={`${chatListOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white dark:bg-[#0C1014] relative`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-[76px] bg-white dark:bg-[#0C1014] border-b border-gray-200 dark:border-[#1F2429] flex items-center justify-between px-6 sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-gray-400" onClick={() => setChatListOpen(true)}>
                  <ArrowLeft size={24} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                    {activeChatUser?.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#0C1014] ${activeChatUser?.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{activeChatUser?.name}</h3>
                  <p className="text-xs font-medium text-gray-500">{activeChatUser?.status === 'online' ? 'Active Now' : 'Offline'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-500">
                <button className="hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F2429]"><Phone size={20} /></button>
                <button className="hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F2429]"><Video size={20} /></button>
                <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F2429]"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <Toaster />
              {/* <div className="text-center my-4">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">Today</span>
              </div> */}
              {conversation.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} group`}>
                  <div className={`relative max-w-[70%] md:max-w-[60%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === "me" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-[#262626] text-gray-800 dark:text-white border border-gray-100 dark:border-[#262626] rounded-tl-sm"}`}>

                    {/* Message Text */}
                    <p className={`text-sm leading-relaxed ${msg.is_deleted ? 'italic opacity-60' : ''}`}>
                      {msg.text}
                      {msg.is_edited && !msg.is_deleted && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
                    </p>

                    {/* Metadata: Time + Ticks */}
                    <div className={`flex items-center justify-end gap-1 mt-1.5 ${msg.sender === "me" ? "text-blue-100" : "text-gray-400"}`}>
                      <p className="text-[10px] font-medium opacity-70">{msg.time}</p>

                      {/* Ticks for My Messages */}
                      {msg.sender === "me" && !msg.is_deleted && (
                        <span className="flex items-center">
                          {/* Sending (Clock) */}
                          {msg.status === 'sending' && <Clock size={12} className="opacity-70" />}
                          {/* Single Tick (Sent) */}
                          {msg.status === 'sent' && <Check size={14} className="opacity-70" />}
                          {/* Double Tick (Delivered/Read) */}
                          {(msg.status === 'delivered' || msg.status === 'read') && (
                            <CheckCheck size={14} className={msg.status === 'read' ? 'text-blue-200' : 'opacity-70'} />
                          )}
                          {/* Default fallback if status missing but "me" */}
                          {!msg.status && <Check size={14} className="opacity-70" />}
                        </span>
                      )}
                    </div>

                    {/* Action Menu (Hover) */}
                    {msg.sender === "me" && !msg.is_deleted && (
                      <div className="absolute top-2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-[#262626] shadow-md rounded-lg p-1 border border-gray-100 dark:border-[#1F2429]">
                        <button onClick={() => {
                          const newText = prompt("Edit message:", msg.text);
                          if (newText && newText !== msg.text) handleEditMessage(msg.id, newText, selectedChat);
                        }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1F2429] rounded text-gray-400" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteMessage(msg.id, selectedChat)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1F2429] text-red-500 rounded" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#0C1014] border-t border-gray-200 dark:border-[#1F2429]">
              <div className="flex items-center gap-3 max-w-4xl mx-auto bg-gray-50 dark:bg-[#1F2429] border border-gray-200 dark:border-[#1F2429] rounded-xl p-2 pr-2 shadow-xs focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className={`p-2.5 rounded-lg transition-all ${inputMessage.trim() ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 transform hover:scale-105' : 'bg-gray-200 dark:bg-[#2A3138] text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                >
                  <Send size={18} className={inputMessage.trim() ? 'ml-0.5' : ''} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-24 h-24 bg-gray-100 dark:bg-[#1F2429] rounded-full flex items-center justify-center mb-6">
              <Info size={40} className="text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Chat Selected</p>
            <p className="text-sm text-gray-500 mt-2 max-w-xs text-center">Choose a colleague from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div >
  )
}

export default Chat