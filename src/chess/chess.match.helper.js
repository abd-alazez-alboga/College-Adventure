// src/chess/chess.match.helper.js

const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");
const { getUserById } = require("./data/user.repo");
const { createMatch } = require("./data/match.repo");
const { isValidTimeControl } = require("./domain/time-controls");
const { chooseColors } = require("./engine/color.service");

/**
 * Create a match row with timer and notify both players.
 * playerX.timer must match and be a valid standard control.
 */
async function createMatchAndNotify(
  player1,
  player2,
  queueSockets /* _pool unused */
) {
  // 1) Validate timer agreement + whitelist
  const t1 = player1?.timer || {};
  const t2 = player2?.timer || {};
  if (!t1 || !t2 || t1.base !== t2.base || t1.increment !== t2.increment) {
    return safeNotifyBothError(
      queueSockets,
      player1?.userId,
      player2?.userId,
      "Timer mismatch"
    );
  }
  if (!isValidTimeControl(t1)) {
    return safeNotifyBothError(
      queueSockets,
      player1?.userId,
      player2?.userId,
      "Unsupported time control"
    );
  }

  const matchId = uuidv4();

  // 2) Load users (need LastColorPlayed for fairness)
  const a = await getUserById(player1.userId);
  const b = await getUserById(player2.userId);

  // 3) Decide colors
  let whiteId, blackId;
  if (!a || !b) {
    whiteId = Math.random() < 0.5 ? player1.userId : player2.userId;
    blackId = whiteId === player1.userId ? player2.userId : player1.userId;
  } else {
    ({ whiteId, blackId } = chooseColors({
      aId: player1.userId,
      aLast: a.last_color_played,
      bId: player2.userId,
      bLast: b.last_color_played,
      matchId,
    }));
  }

  // 4) Persist match (base time in ms, increment in seconds)
  const baseMs = Math.max(1, t1.base | 0) * 1000;
  const incrementSeconds = Math.max(0, t1.increment | 0);

  await createMatch({
    matchId,
    player1Id: whiteId,
    player2Id: blackId,
    baseMs,
    incrementSeconds,
  });

  // 5) Notify both ends
  const timer = { base: t1.base, increment: t1.increment };
  const p1Role = player1.userId === whiteId ? "white" : "black";
  const p2Role = player2.userId === whiteId ? "white" : "black";

  safeSend(queueSockets.get(player1.userId), {
    type: "match:found",
    matchId,
    role: p1Role,
    opponent: { userId: player2.userId, username: player2.username },
    timer,
  });

  safeSend(queueSockets.get(player2.userId), {
    type: "match:found",
    matchId,
    role: p2Role,
    opponent: { userId: player1.userId, username: player1.username },
    timer,
  });

  return { matchId, whiteId, blackId, timer };
}

// ---- helpers ----------------------------------------------------

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    /* no-op */
  }
}

function safeNotifyBothError(queueSockets, id1, id2, error) {
  safeSend(queueSockets.get(id1), { type: "queue:error", error });
  safeSend(queueSockets.get(id2), { type: "queue:error", error });
  return { error };
}

module.exports = { createMatchAndNotify };
