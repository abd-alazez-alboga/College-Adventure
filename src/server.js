const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const http = require("http");
const server = http.createServer(app);

// PostgreSQL connection
const pool = require("./config/db");
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./auth/auth.routes");
const userRoutes = require("./user/user.routes");
const chatRoutes = require("./chat/chat.routes");
const chessMatchInfoRoutes = require("./chess/chess.match.info.routes");
const chessHistoryRoutes = require("./chess/chess.history.routes");
const chessLeaderboardRoutes = require("./chess/chess.leaderboard.routes");
const chessReplayRoutes = require("./chess/chess.replay.routes");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/chess", chessMatchInfoRoutes);
app.use("/chess", chessHistoryRoutes);
app.use("/chess", chessLeaderboardRoutes);
app.use("/chess", chessReplayRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("College Game Backend is running 🎮");
});

// Time Sync Endpoint
app.get("/time", (req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    timestamp: Date.now(),
    timezone: "UTC",
  });
});

// WebSocket Handlers
const { setupMatchWebSocketHandler } = require("./chess/chess.ws");
const { setupQueueWebSocketHandler } = require("./chess/chess.queue.ws");
const { setupChatWebSocketHandler } = require("./chat/chat.ws");
const { setupLobbyWebSocketHandler } = require("./lobby/lobby.ws");

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Accept either /match/<uuid> OR /match with matchId query param
  if (url.pathname === "/match" || url.pathname.startsWith("/match/")) {
    setupMatchWebSocketHandler(req, socket, head);
  } else if (url.pathname === "/queue/chess") {
    setupQueueWebSocketHandler(req, socket, head);
  } else if (url.pathname === "/chat") {
    setupChatWebSocketHandler(req, socket, head);
  } else if (url.pathname === "/lobby") {
    setupLobbyWebSocketHandler(req, socket, head);
  } else {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
  }
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🧠 HTTP + WS server running on http://localhost:${PORT}`);
});

/*
---------------------------------------
{ "type": "chess:move", "move": { "from": "e2", "to": "e4" } }  
---------------------------------------
{ "type": "chess:move", "move": { "from": "e7", "to": "e5" } }
---------------------------------------
{ "type": "chess:move", "move": { "from": "d1", "to": "h5" } }
---------------------------------------
{ "type": "chess:move", "move": { "from": "b8", "to": "c6" } }
---------------------------------------
{ "type": "chess:move", "move": { "from": "f1", "to": "c4" } }
---------------------------------------
{ "type": "chess:move", "move": { "from": "g8", "to": "f6" } }
---------------------------------------
{ "type": "chess:move", "move": { "from": "h5", "to": "f7" } }
---------------------------------------
*/
