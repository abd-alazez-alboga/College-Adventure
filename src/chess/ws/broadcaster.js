// src/chess/ws/broadcaster.js
const WebSocket = require("ws");

/** Safe send with JSON.stringify + OPEN check. */
function send(ws, payload) {
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  } catch {
    /* swallow */
  }
}

/** Broadcast to an array of ws clients. */
function broadcast(wssArray, payload) {
  (wssArray || []).forEach((client) => send(client, payload));
}

module.exports = { send, broadcast };
