// src/chess/engine/game.engine.js
//
// Orchestrates one ply: tick clock → apply move → compute game-over.
// Pure (DB-free). Returns clear signals for the WS layer.

const { applyMove, isGameOver } = require("./move.service");
const { tickOnMove, serialize: serializeClock } = require("./clock.service");

/**
 * Handle a player move.
 * @param {Object} game - in-memory state { chess, players, whiteTimeLeft, blackTimeLeft, increment, lastMoveTime, ... }
 * @param {number} userId - the player attempting to move
 * @param {{from:string, to:string, promotion?:string}} moveIn
 * @returns {{
 *   ok: boolean,
 *   error?: string,
 *   move?: any,
 *   fen?: string,
 *   clocks?: {white:number, black:number},
 *   finished?: { reason: 'checkmate'|'draw'|'timeout', winnerOverride?: number }
 * }}
 */
function handleMove(game, userId, moveIn) {
  const chess = game.chess;
  const { whiteId, blackId } = game.players;

  // 1) Turn enforcement (WS should also check, but keep it here for safety)
  const expectedColor = chess.turn() === "w" ? whiteId : blackId;
  console.log("[DEBUG] handleMove: chess.turn =", chess.turn());
  console.log("[DEBUG] handleMove: expectedColor =", expectedColor);
  console.log("[DEBUG] handleMove: userId =", userId);
  if (expectedColor !== userId) {
    console.log("[DEBUG] handleMove: Not your turn");
    return { ok: false, error: "Not your turn" };
  }

  // 2) Tick clock for the side to move (BEFORE applying the move)
  const turnBefore = chess.turn(); // 'w' | 'b'
  const tick = tickOnMove(game, turnBefore);
  if (tick.timedOut) {
    const winnerOverride = turnBefore === "w" ? blackId : whiteId;
    return {
      ok: true,
      clocks: serializeClock(game),
      finished: { reason: "timeout", winnerOverride },
    };
  }

  // 3) Apply move (via chess.js)
  const result = applyMove(game, moveIn);
  if (!result.ok) return result;

  // 4) Build clocks snapshot post-increment
  const clocks = serializeClock(game);

  // 5) Game-over by rules? (checkmate/draw family)
  const over = isGameOver(game);
  if (over.over) {
    // After applying a move, chess.turn() is the next side to move.
    // If it's checkmate, that side is checkmated, so the winner is the opposite.
    let winnerOverride = undefined;
    if (over.reason === "checkmate") {
      winnerOverride = chess.turn() === "w" ? blackId : whiteId;
    }
    return {
      ok: true,
      move: result.move,
      fen: result.fen,
      clocks,
      finished: { reason: over.reason || "checkmate", winnerOverride },
    };
  }

  // 6) Normal move — continue
  return {
    ok: true,
    move: result.move,
    fen: result.fen,
    clocks,
  };
}

module.exports = { handleMove };
