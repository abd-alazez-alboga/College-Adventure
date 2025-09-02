const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { ensureGeneralRoom, createMessage } = require('./data/chat.repo');
const { send, broadcast } = require('../chess/ws/broadcaster');
const { getUserById } = require('../chess/data/user.repo');

const chatWss = new WebSocket.Server({ noServer: true });
const HEARTBEAT_MS = 30000;

function setupHeartbeatOnce(wss) {
  if (wss._heartbeatInterval) return;
  wss._heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws._isAlive === false) {
        try { ws.terminate(); } catch {}
        return;
      }
      ws._isAlive = false;
      try { ws.ping(); } catch {}
    });
  }, HEARTBEAT_MS);
}

function setupChatWebSocketHandler(req, socket, head) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    chatWss.handleUpgrade(req, socket, head, (ws) => {
      chatWss.emit('connection', ws, req);
    });
  } catch {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
  }
}

chatWss.on('connection', async (ws, req) => {
  setupHeartbeatOnce(chatWss);
  ws._isAlive = true;
  ws.on('pong', () => (ws._isAlive = true));

  const userId = req.user.userId;
  ws._userId = userId;
  // Load minimal user profile for presence
  let userProfile = null;
  try {
    userProfile = await getUserById(userId);
  } catch {}
  ws._user = {
    userId,
    username: userProfile?.username || `user_${userId}`,
  };

  const roomId = await ensureGeneralRoom();
  // simple join ack + current online list
  const onlineUsers = Array.from(chatWss.clients || [])
    .filter((c) => c._user)
    .map((c) => c._user);
  send(ws, { type: 'chat:joined', roomId, me: ws._user, online: onlineUsers });
  // notify others
  broadcast(
    Array.from(chatWss.clients || []).filter((c) => c !== ws),
    { type: 'chat:join', user: ws._user }
  );

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);
      const type = data.type;
      if (type === 'chat:message') {
        const content = (data.content || '').toString();
        if (!content.trim()) return;
        
        // Create message in memory only (not stored in DB for cafeteria chat)
        const msg = {
          id: Date.now() + Math.random(),
          room_id: roomId,
          user_id: userId,
          content: content.trim(),
          created_at: new Date().toISOString(),
          user: ws._user
        };
        
        const payload = { type: 'chat:message', message: msg };
        broadcast(Array.from(chatWss.clients || []), payload);
      } else if (type === 'chat:typing') {
        const isTyping = Boolean(data.isTyping);
        const payload = { type: 'chat:typing', user: ws._user, isTyping };
        broadcast(
          Array.from(chatWss.clients || []).filter((c) => c !== ws),
          payload
        );
      }
    } catch (err) {
      send(ws, { type: 'chat:error', error: 'Invalid message' });
    }
  });

  ws.on('close', () => {
    broadcast(Array.from(chatWss.clients || []), {
      type: 'chat:leave',
      user: ws._user,
    });
  });
});

module.exports = { setupChatWebSocketHandler };


