// src/chess/chess.replay.helper.js

const { Chess } = require("chess.js");

function buildReplayFromMoves(moves = []) {
  const chess = new Chess();

  for (const move of moves) {
    const result = chess.move(move);
    if (!result) {
      return {
        valid: false,
        error: `Invalid move detected: ${JSON.stringify(move)}`,
        fen: chess.fen(),
        pgn: chess.pgn(),
      };
    }
  }

  return {
    valid: true,
    fen: chess.fen(),
    pgn: chess.pgn(),
  };
}

module.exports = { buildReplayFromMoves };
