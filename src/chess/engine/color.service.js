// src/chess/engine/color.service.js

/**
 * Decide fair colors using each player's LastColorPlayed ("white"|"black"|null).
 * Rules:
 *  - If A last played white and B last played black -> swap (A black, B white).
 *  - If A last played black and B last played white -> swap (A white, B black).
 *  - If one has null (no history), give them the color opposite to the other.
 *  - If both null or both same last color, pick randomly but deterministically
 *    based on matchId to avoid bias.
 */
function chooseColors({ aId, aLast, bId, bLast, matchId }) {
  const norm = (v) => (v ? v.toLowerCase() : null);

  const A = norm(aLast);
  const B = norm(bLast);

  // Different & complementary -> prefer switching
  if (A === "white" && B === "black")
    return { whiteId: bId, blackId: aId, reason: "complement" };
  if (A === "black" && B === "white")
    return { whiteId: aId, blackId: bId, reason: "complement" };

  // Only one set -> opposite
  if (A && !B)
    return A === "white"
      ? { whiteId: bId, blackId: aId, reason: "a-had-color" }
      : { whiteId: aId, blackId: bId, reason: "a-had-color" };
  if (!A && B)
    return B === "white"
      ? { whiteId: aId, blackId: bId, reason: "b-had-color" }
      : { whiteId: bId, blackId: aId, reason: "b-had-color" };

  // Same or both null -> deterministic pseudo-random from matchId
  let hash = 0;
  for (let i = 0; i < String(matchId).length; i++) {
    hash = (hash * 33 + String(matchId).charCodeAt(i)) | 0;
  }
  const aIsWhite = (hash & 1) === 0;
  return aIsWhite
    ? { whiteId: aId, blackId: bId, reason: "tie-rand" }
    : { whiteId: bId, blackId: aId, reason: "tie-rand" };
}

module.exports = { chooseColors };
