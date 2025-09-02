// src/chess/chess.leaderboard.controller.js
const pool = require("../config/db");

/**
 * Get top players ranked by chess Elo.
 */
exports.getChessLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         userid   AS user_id,
         username,
         elochess AS elo_chess
       FROM "user"
       WHERE is_banned = false
       ORDER BY elochess DESC
       LIMIT 50`
    );

    const leaderboard = result.rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      elo: row.elo_chess,
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("[LEADERBOARD] Failed to fetch:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};
