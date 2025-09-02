// src/chess/chess.queue.ws.js
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // still used to read Elo/username
const { createMatchAndNotify } = require("./chess.match.helper");
const { isValidTimeControl } = require("./domain/time-controls");

// in‑memory queue per time control key "base:inc"
const buckets = new Map(); // key -> [{ userId, username, elo, timer }]
const queueSockets = new Map(); // userId -> ws

function keyOf(timer) {
  return `${timer.base}:${timer.increment}`;
}

function getBucket(timer) {
  const k = keyOf(timer);
  if (!buckets.has(k)) buckets.set(k, []);
  return buckets.get(k);
}

function removeFromBucket(timer, userId) {
  const b = getBucket(timer);
  const i = b.findIndex((u) => u.userId === userId);
  if (i !== -1) b.splice(i, 1);
}

const queueWss = new WebSocket.Server({ noServer: true });

function setupQueueWebSocketHandler(req, socket, head) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== "/queue/chess") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  const token = url.searchParams.get("token");
  const base = Number(url.searchParams.get("base")); // seconds
  const inc = Number(url.searchParams.get("inc")); // seconds
  const timer = { base, increment: inc };

  // Strict URL validation
  if (
    !token ||
    !Number.isFinite(base) ||
    !Number.isFinite(inc) ||
    !isValidTimeControl(timer)
  ) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    req.timer = timer;

    queueWss.handleUpgrade(req, socket, head, (ws) => {
      queueWss.emit("connection", ws, req);
    });
  } catch {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
  }
}

queueWss.on("connection", async (ws, req) => {
  const userId = req.user.userId;
  const timer = req.timer;
  console.log(
    `[QUEUE] Connected: userId=${userId}, base=${timer.base}, inc=${timer.increment}`
  );
  // load username + elo (minimal)
  try {
    const { rows } = await pool.query(
      `SELECT "userid", "username", "elochess"
   FROM "user" WHERE "userid" = $1`,
      [userId]
    );
    const u = rows[0];
    if (!u) {
      ws.close();
      return;
    }

    queueSockets.set(userId, ws);

    const me = {
      userId: u.userid,
      username: u.username,
      elo: u.elochess,
      timer, // { base, increment }
    };

    // Try to find opponent in the *same* timer bucket, ±200 Elo window
    const bucket = getBucket(timer);
    const idx = bucket.findIndex(
      (op) => Math.abs(op.elo - me.elo) <= 200 && op.userId !== me.userId
    );

    if (idx !== -1) {
      const opponent = bucket.splice(idx, 1)[0]; // remove opponent from bucket
      // Create DB match + notify both with role and canonical timer
      await createMatchAndNotify(me, opponent, queueSockets);
    } else {
      // No opponent yet — enqueue and wait
      bucket.push(me);
      ws.send(JSON.stringify({ type: "queue:waiting", timer }));
    }

    ws.on("close", () => {
      queueSockets.delete(userId);
      // best‑effort remove from the right bucket
      removeFromBucket(timer, userId);
    });
  } catch (err) {
    console.error("Queue WS error:", err);
    ws.close();
  }
});

module.exports = { setupQueueWebSocketHandler };
