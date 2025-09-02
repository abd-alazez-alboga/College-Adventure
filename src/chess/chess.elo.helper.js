// src/chess/chess.elo.helper.js

function calculateEloChange(playerElo, opponentElo, result, kFactor = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = result; // 1 = win, 0.5 = draw, 0 = loss
  return Math.round(kFactor * (actualScore - expectedScore));
}

module.exports = { calculateEloChange };
