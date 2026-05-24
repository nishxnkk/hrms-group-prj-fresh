import { io } from 'socket.io-client';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// Enable debug logs by setting VITE_PRESENCE_DEBUG=true in your .env
const DEBUG = import.meta.env.VITE_PRESENCE_DEBUG === 'true';

let heartbeatTimer = null;
let lastActivity = Date.now();
let idle = false;
let socket = null;
let idleCheckTimer = null;

const HEARTBEAT_INTERVAL = 15 * 1000; // 15 seconds (more frequent to keep ACTIVE windows updated)
const IDLE_TIMEOUT = 30 * 1000; // 30 seconds -> consider client idle locally (matches stricter ACTIVE window)

const sendHeartbeat = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      if (DEBUG) console.debug('[presence] sendHeartbeat: no token, skipping');
      return;
    }
    if (DEBUG) console.debug('[presence] sendHeartbeat: sending heartbeat to', `${API_BASE}/api/users/heartbeat`);
    await fetch(`${API_BASE}/api/users/heartbeat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (DEBUG) console.debug('[presence] sendHeartbeat: success');
  } catch (err) {
    // ignore errors but log when debugging
    console.warn('Heartbeat failed', err);
    if (DEBUG) console.debug('[presence] sendHeartbeat: failed', err);
  }
};

const startHeartbeats = () => {
  if (heartbeatTimer) {
    if (DEBUG) console.debug('[presence] startHeartbeats: already running');
    return;
  }
  if (DEBUG) console.debug('[presence] startHeartbeats: starting');
  sendHeartbeat();
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
};

const stopHeartbeats = () => {
  if (!heartbeatTimer) {
    if (DEBUG) console.debug('[presence] stopHeartbeats: already stopped');
    return;
  }
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  if (DEBUG) console.debug('[presence] stopHeartbeats: stopped');
};

const onActivity = () => {
  lastActivity = Date.now();
  if (idle) {
    idle = false;
    if (DEBUG) console.debug('[presence] onActivity: became active, restarting heartbeats');
    startHeartbeats();

    // Immediately inform local UI and server that we're active
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const detail = { userId: String(u.id), status: 'ACTIVE', last_activity: new Date().toISOString() };
        window.dispatchEvent(new CustomEvent('presence:update', { detail }));
        if (socket && socket.connected) {
          socket.emit('user_active', u.id);
          if (DEBUG) console.debug('[presence] emitted user_active to server', u.id);
        }
      }
    } catch (e) {
      if (DEBUG) console.debug('[presence] onActivity: failed to emit user_active', e);
    }
  } else {
    if (DEBUG) console.debug('[presence] onActivity: activity detected');
  }
};

const checkIdle = () => {
  if (Date.now() - lastActivity > IDLE_TIMEOUT) {
    if (!idle) {
      idle = true;
      if (DEBUG) console.debug('[presence] checkIdle: idle detected, stopping heartbeats');
      stopHeartbeats();

      // Inform local UI and server that we've become idle so others see IDLE immediately
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const detail = { userId: String(u.id), status: 'IDLE', last_activity: null };
          window.dispatchEvent(new CustomEvent('presence:update', { detail }));
          if (socket && socket.connected) {
            socket.emit('user_idle', u.id);
            if (DEBUG) console.debug('[presence] emitted user_idle to server', u.id);
          }
        }
      } catch (e) {
        if (DEBUG) console.debug('[presence] checkIdle: failed to emit user_idle', e);
      }
    }
  }
};

const initSocket = () => {
  try {
    socket = io(API_BASE.replace(/^http/, 'ws'));

    socket.on('connect', () => {
      if (DEBUG) console.debug('[presence] socket connected', socket.id);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          socket.emit('user_connected', u.id);
          // Immediately inform local UI about our presence so we see ACTIVE locally
          const detail = { userId: String(u.id), status: 'ACTIVE', last_activity: new Date().toISOString() };
          window.dispatchEvent(new CustomEvent('presence:update', { detail }));
          if (DEBUG) console.debug('[presence] socket emitted user_connected and dispatched local presence:update', detail);
        } catch (e) { console.warn('presence connect parse user failed', e); if (DEBUG) console.debug('[presence] socket connect user parse failed', e); }
      }
    });

    socket.on('disconnect', (reason) => {
      if (DEBUG) console.debug('[presence] socket disconnected', reason);
    });

    socket.on('connect_error', (err) => {
      if (DEBUG) console.debug('[presence] socket connect_error', err);
    });

    socket.on('presence:update', (data) => {
      if (DEBUG) console.debug('[presence] received presence:update', data);
      // Re-emit as DOM event so components can listen
      window.dispatchEvent(new CustomEvent('presence:update', { detail: data }));
    });
  } catch (err) {
    console.warn('Failed to init socket', err);
    if (DEBUG) console.debug('[presence] initSocket failed', err);
  }
};

export function initPresence() {
  if (DEBUG) console.debug('[presence] initPresence starting');
  // Start sending heartbeats if user is present
  startHeartbeats();
  initSocket();

  // Attach listeners
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];
  activityEvents.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (DEBUG) console.debug('[presence] visibilitychange: hidden, stopping heartbeats');
      stopHeartbeats();
    } else {
      if (DEBUG) console.debug('[presence] visibilitychange: visible, starting heartbeats');
      startHeartbeats();
    }
  });

  // Periodic idle check
  idleCheckTimer = setInterval(checkIdle, 10 * 1000);

  if (DEBUG) console.debug('[presence] initPresence ready');

  // Return cleanup in case caller needs to stop
  return () => {
    if (DEBUG) console.debug('[presence] cleanup: stopping presence');
    stopHeartbeats();
    if (socket) socket.disconnect();
    if (idleCheckTimer) {
      clearInterval(idleCheckTimer);
      idleCheckTimer = null;
    }
    activityEvents.forEach(ev => window.removeEventListener(ev, onActivity));
  };
}
