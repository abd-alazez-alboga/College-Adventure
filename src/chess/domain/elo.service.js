// src/chess/domain/elo.service.js
// Thin wrapper so engine/result can depend on domain (not helpers directly).
const { calculateEloChange } = require("../chess.elo.helper");

/** Returns integer elo delta given two ratings and a result (1 / 0.5 / 0). */
function eloDelta(playerElo, opponentElo, result) {
  return calculateEloChange(playerElo, opponentElo, result);
}

module.exports = { eloDelta };
