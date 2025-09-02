// src/chess/domain/messages.js

// ---- Client → Server guards
function isMoveMessage(msg) {
  return (
    msg &&
    msg.type === "chess:move" &&
    msg.move &&
    typeof msg.move.from === "string" &&
    typeof msg.move.to === "string"
  );
}

function isSyncMessage(msg) {
  return msg && msg.type === "chess:sync";
}

// ---- Server → Client builders
function msgError(error) {
  return { type: "chess:error", error };
}
function msgMove(move, fen) {
  return { type: "chess:move", move, fen };
}
function msgClock(whiteMs, blackMs) {
  return { type: "chess:clock", white: whiteMs, black: blackMs };
}
function msgSync({
  fen,
  moves,
  turnUserId,
  whiteId,
  blackId,
  whiteMs,
  blackMs,
  role,
}) {
  return {
    type: "chess:sync",
    fen,
    moves,
    turn: turnUserId,
    whiteId,
    blackId,
    whiteTimeLeft: whiteMs,
    blackTimeLeft: blackMs,
    role, // optional for spectators vs players
  };
}
function msgResult({ reason, winnerId, white, black }) {
  return { type: "chess:result", reason, winnerId, white, black };
}
function msgQueueWaiting() {
  return { type: "queue:waiting" };
}
function msgMatchFound({ matchId, role, opponent, timer }) {
  return { type: "match:found", matchId, role, opponent, timer };
}

module.exports = {
  // guards
  isMoveMessage,
  isSyncMessage,
  // builders
  msgError,
  msgMove,
  msgClock,
  msgSync,
  msgResult,
  msgQueueWaiting,
  msgMatchFound,
};
