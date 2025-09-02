const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const { getUserById } = require("../chess/data/user.repo");
const { send, broadcast } = require("../chess/ws/broadcaster");

// Validation functions
function isValidCoords(coordinates) {
  return (
    coordinates &&
    typeof coordinates.x === "number" &&
    Number.isFinite(coordinates.x) &&
    typeof coordinates.y === "number" &&
    Number.isFinite(coordinates.y) &&
    typeof coordinates.z === "number" &&
    Number.isFinite(coordinates.z)
  );
}

function isValidState(state) {
  return typeof state === "string" && state.length >= 1 && state.length <= 256;
}

const lobbyWss = new WebSocket.Server({ noServer: true });
const HEARTBEAT_MS = 30000;

// Store lobby state
const lobbyState = {
  players: new Map(), // userId -> { user, coordinates, state, ws }
  coordinates: new Map(), // userId -> { x, y, z }
};

function setupHeartbeatOnce(wss) {
  if (wss._heartbeatInterval) return;
  wss._heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws._isAlive === false) {
        try {
          ws.terminate();
        } catch {}
        return;
      }
      ws._isAlive = false;
      try {
        ws.ping();
      } catch {}
    });
  }, HEARTBEAT_MS);
}

function setupLobbyWebSocketHandler(req, socket, head) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  if (!token) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    lobbyWss.handleUpgrade(req, socket, head, (ws) => {
      lobbyWss.emit("connection", ws, req);
    });
  } catch {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
  }
}

function broadcastPlayerPositions(excludeWs = null) {
  const players = Array.from(lobbyState.players.values()).map((player) => ({
    userId: player.user.userId,
    username: player.user.username,
    coordinates: player.coordinates,
  }));

  const payload = {
    type: "lobby:positions",
    players: players,
  };

  const clients = Array.from(lobbyWss.clients || []);
  if (excludeWs) {
    broadcast(
      clients.filter((c) => c !== excludeWs),
      payload
    );
  } else {
    broadcast(clients, payload);
  }
}

lobbyWss.on("connection", async (ws, req) => {
  setupHeartbeatOnce(lobbyWss);
  ws._isAlive = true;
  ws.on("pong", () => (ws._isAlive = true));

  const userId = req.user.userId;
  ws._userId = userId;

  // Load user profile
  let userProfile = null;
  try {
    userProfile = await getUserById(userId);
  } catch {}

  const user = {
    userId,
    username: userProfile?.username || `user_${userId}`,
  };

  // Initialize player with default coordinates and empty state
  const defaultCoordinates = { x: 0, y: 0, z: 0 };
  const defaultState =
    "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1";
  lobbyState.players.set(userId, {
    user,
    coordinates: defaultCoordinates,
    state: defaultState,
    ws,
  });
  lobbyState.coordinates.set(userId, defaultCoordinates);

  // Send current lobby state to new player
  send(ws, {
    type: "lobby:joined",
    me: user,
    coordinates: defaultCoordinates,
  });

  // Send current positions to new player
  const currentPlayers = Array.from(lobbyState.players.values())
    .filter((p) => p.user.userId !== userId)
    .map((p) => ({
      userId: p.user.userId,
      username: p.user.username,
      coordinates: p.coordinates,
      state: p.state,
    }));

  if (currentPlayers.length > 0) {
    send(ws, {
      type: "lobby:positions",
      players: currentPlayers,
    });
  }

  // Notify others about new player
  broadcast(
    Array.from(lobbyWss.clients || []).filter((c) => c !== ws),
    {
      type: "lobby:join",
      user,
      coordinates: defaultCoordinates,
      state: defaultState,
    }
  );

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);
      const type = data.type;

      if (type === "lobby:move") {
        // Validate coordinates
        if (!isValidCoords(data.coordinates)) {
          send(ws, {
            type: "lobby:error",
            error: "Invalid lobby:move",
            details: "coordinates must contain finite numbers for x, y, z",
          });
          return;
        }

        // Validate state
        if (!isValidState(data.state)) {
          send(ws, {
            type: "lobby:error",
            error: "Invalid lobby:move",
            details: "state is required and must be a non-empty string <= 256",
          });
          return;
        }

        // Update player coordinates and state
        const newCoordinates = data.coordinates;
        lobbyState.coordinates.set(userId, newCoordinates);

        if (lobbyState.players.has(userId)) {
          lobbyState.players.get(userId).coordinates = newCoordinates;
          lobbyState.players.get(userId).state = data.state;
        }

        // Build broadcast payload with serverTs
        const broadcastPayload = {
          type: "lobby:move",
          user,
          coordinates: newCoordinates,
          state: data.state,
          serverTs: Date.now(),
        };

        // Broadcast position update to other players
        broadcast(
          Array.from(lobbyWss.clients || []).filter((c) => c !== ws),
          broadcastPayload
        );
      }
    } catch (err) {
      send(ws, { type: "lobby:error", error: "Invalid message" });
    }
  });

  ws.on("close", () => {
    // Remove player from lobby state
    lobbyState.players.delete(userId);
    lobbyState.coordinates.delete(userId);

    // Notify others about player leaving
    broadcast(Array.from(lobbyWss.clients || []), {
      type: "lobby:leave",
      user,
    });
  });
});

module.exports = { setupLobbyWebSocketHandler };
