// src/chess/chess.replay.controller.js
const { getMatch } = require("./data/match.repo");

/**
 * Public replay endpoint.
 * Returns moves and basic metadata for a given matchId.
 */
exports.getReplay = async (req, res) => {
  const matchId = req.params.matchId;

  try {
    const match = await getMatch(matchId);
    if (!match) {
      return res
        .status(404)
        .json({ success: false, error: "Replay not found" });
    }

    const replay = {
      moves: Array.isArray(match.moves) ? match.moves : [],
      duration_seconds: match.duration_seconds || 0,
      created_at: match.created_at || null,
    };

    res.json({ success: true, replay });
  } catch (err) {
    console.error("[REPLAY] Failed to load replay:", err);
    res.status(500).json({ success: false, error: "Failed to load replay" });
  }
};
