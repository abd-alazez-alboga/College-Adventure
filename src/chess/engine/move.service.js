// src/chess/engine/move.service.js

/**
 * Thin wrapper around chess.js to keep chess.ws.js simple and testable.
 */

function applyMove(game, moveIn) {
  try {
    const { from, to, promotion } = moveIn || {};
    const move = game.chess.move({ from, to, promotion });

    if (!move) {
      return { ok: false, error: "Invalid move" };
    }

    return { ok: true, move, fen: game.chess.fen() };
  } catch (e) {
    return { ok: false, error: "Invalid move" };
  }
}

/**
 * Returns { over, reason? }
 * - reason: 'checkmate' | 'draw'
 *   (timeout/disconnect/aborted are external reasons decided by server)
 */
function isGameOver(game) {
  const c = game.chess;
  if (!c.isGameOver()) return { over: false };

  if (c.isCheckmate()) return { over: true, reason: "checkmate" };
  // Other endings from chess.js we surface as 'draw' here
  if (
    c.isDraw() ||
    c.isStalemate() ||
    c.isThreefoldRepetition() ||
    c.isInsufficientMaterial()
  ) {
    return { over: true, reason: "draw" };
  }
  return { over: true }; // fallback
}

function fen(game) {
  return game.chess.fen();
}

function pgn(game) {
  return game.chess.pgn();
}

module.exports = {
  applyMove,
  isGameOver,
  fen,
  pgn,
};
