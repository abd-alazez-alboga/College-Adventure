// src/chess/chess.history.controller.js
const pool = require("../config/db");

/**
 * Get chess match history for the current user.
 * Pulls from user_matches table with metadata.
 */
exports.getChessMatchHistory = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT
         match_id,
         role,
         result,
         elo_before,
         elo_after,
         opponent_id,
         opponent_username,
         opponent_elo_before,
         opponent_elo_after,
         duration_seconds,
         moves,
         created_at
       FROM user_matches
       WHERE user_id = $1
         ORDER BY created_at DESC`,
      [userId]
    );

    const history = result.rows.map((match) => ({
      matchId: match.match_id,
      role: match.role,
      result: match.result,
      eloBefore: match.elo_before,
      eloAfter: match.elo_after,
      opponent: {
        id: match.opponent_id,
        username: match.opponent_username,
        eloBefore: match.opponent_elo_before,
        eloAfter: match.opponent_elo_after,
      },
      durationSeconds: match.duration_seconds,
      moves: match.moves,
      createdAt: match.created_at,
    }));

    res.json({ success: true, history });
  } catch (err) {
    console.error("[HISTORY] Failed to load match history:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to load match history" });
  }
};
