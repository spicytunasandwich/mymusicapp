const jwt = require('jsonwebtoken');
const { pool } = require('./config/db');

// In-memory connected clients map: userId -> Set of WebSocket connections
const connectedClients = new Map();
// Presence state: userId -> { status, currentTrack, showActivity, lastSeen }
const userPresence = new Map();

function initWebSocketServer(server) {
  let WebSocketServer;
  try {
    WebSocketServer = require('ws').Server;
  } catch (err) {
    console.warn('ws package not yet installed locally. WebSocket features will activate on cloud deploy.');
    return;
  }

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let authUserId = null;
    let authUser = null;

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        // 1. Authenticate WebSocket session
        if (message.type === 'auth') {
          const { token } = message;
          if (!token) return;

          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'audira-super-secret-jwt-key-2024');
            authUserId = decoded.id;

            // Fetch user profile info
            const res = await pool.query(
              'SELECT id, username, display_name, avatar_url, show_activity FROM users WHERE id = $1',
              [authUserId]
            );

            if (res.rows.length > 0) {
              authUser = res.rows[0];

              if (!connectedClients.has(authUserId)) {
                connectedClients.set(authUserId, new Set());
              }
              connectedClients.get(authUserId).add(ws);

              // Initialize presence
              const existingPresence = userPresence.get(authUserId) || {};
              userPresence.set(authUserId, {
                status: 'online',
                currentTrack: existingPresence.currentTrack || null,
                showActivity: authUser.show_activity !== false,
                lastSeen: Date.now()
              });

              // Confirm auth to sender
              ws.send(JSON.stringify({
                type: 'auth_success',
                user: authUser,
                presence: userPresence.get(authUserId)
              }));

              // Broadcast online state to all
              broadcastPresence(authUserId, {
                userId: authUserId,
                username: authUser.username,
                displayName: authUser.display_name,
                avatarUrl: authUser.avatar_url,
                status: 'online',
                currentTrack: (authUser.show_activity !== false) ? existingPresence.currentTrack : null
              });
            }
          } catch (jwtErr) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token.' }));
          }
        }

        // 2. Presence Update (Listening to X, status = online / idle)
        else if (message.type === 'presence' && authUserId) {
          const { status = 'online', currentTrack = null } = message;
          const current = userPresence.get(authUserId) || {};

          userPresence.set(authUserId, {
            ...current,
            status,
            currentTrack,
            lastSeen: Date.now()
          });

          // Update DB async
          pool.query(
            'UPDATE users SET presence_status = $1, current_track_json = $2, updated_at = NOW() WHERE id = $3',
            [status, currentTrack ? JSON.stringify(currentTrack) : null, authUserId]
          ).catch(e => console.warn('DB presence update error:', e.message));

          // Broadcast to connected users
          const canShare = current.showActivity !== false;
          broadcastPresence(authUserId, {
            userId: authUserId,
            username: authUser?.username,
            displayName: authUser?.display_name,
            avatarUrl: authUser?.avatar_url,
            status,
            currentTrack: canShare ? currentTrack : null
          });
        }

        // 3. Privacy Toggle (Show/Hide "Listening to X")
        else if (message.type === 'privacy_toggle' && authUserId) {
          const { showActivity } = message;
          const current = userPresence.get(authUserId) || {};
          current.showActivity = Boolean(showActivity);
          userPresence.set(authUserId, current);

          pool.query(
            'UPDATE users SET show_activity = $1 WHERE id = $2',
            [Boolean(showActivity), authUserId]
          ).catch(e => console.warn('DB privacy toggle error:', e.message));

          broadcastPresence(authUserId, {
            userId: authUserId,
            username: authUser?.username,
            displayName: authUser?.display_name,
            avatarUrl: authUser?.avatar_url,
            status: current.status || 'online',
            currentTrack: showActivity ? current.currentTrack : null
          });
        }

        // 4. Ping/Heartbeat
        else if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.warn('WebSocket message error:', err.message);
      }
    });

    ws.on('close', () => {
      if (authUserId) {
        const userSockets = connectedClients.get(authUserId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            connectedClients.delete(authUserId);
            const current = userPresence.get(authUserId) || {};
            current.status = 'offline';
            current.currentTrack = null;
            userPresence.set(authUserId, current);

            pool.query(
              'UPDATE users SET presence_status = $1, current_track_json = NULL WHERE id = $2',
              ['offline', authUserId]
            ).catch(() => {});

            broadcastPresence(authUserId, {
              userId: authUserId,
              username: authUser?.username,
              displayName: authUser?.display_name,
              avatarUrl: authUser?.avatar_url,
              status: 'offline',
              currentTrack: null
            });
          }
        }
      }
    });
  });

  // Heartbeat ping interval every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('⚡ Real-time WebSocket presence server initialized on /ws');
}

function broadcastPresence(senderUserId, payload) {
  const messageStr = JSON.stringify({
    type: 'presence_broadcast',
    data: payload
  });

  connectedClients.forEach((sockets, userId) => {
    sockets.forEach((socket) => {
      if (socket.readyState === 1) { // OPEN
        socket.send(messageStr);
      }
    });
  });
}

function getUserPresence(userId) {
  return userPresence.get(userId) || { status: 'offline', currentTrack: null };
}

module.exports = {
  initWebSocketServer,
  broadcastPresence,
  getUserPresence,
  userPresence
};
