// src/chess/chess.match.info.controller.js
const pool = require("../config/db");

/**
 * Get the current active chess match for the user (if any).
 * Useful for resuming gameplay on reconnect.
 */
exports.getMatchInfo = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT
         m.matchid         AS match_id,
         m.player1_id      AS player1_id,
         m.player2_id      AS player2_id,
         m.increment       AS increment,
         m.white_time_left AS white_time_left,
         m.black_time_left AS black_time_left,
         u1.username       AS username1,
         u2.username       AS username2
       FROM match m
       JOIN "user" u1 ON u1.userid = m.player1_id
       JOIN "user" u2 ON u2.userid = m.player2_id
       WHERE m.status = 'active'
         AND (m.player1_id = $1 OR m.player2_id = $1)
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, match: null });
    }

    const match = result.rows[0];

    const role = match.player1_id === userId ? "white" : "black";
    const opponentId = role === "white" ? match.player2_id : match.player1_id;
    const opponentUsername =
      role === "white" ? match.username2 : match.username1;
    const time = {
      white: match.white_time_left,
      black: match.black_time_left,
      inc: match.increment,
    };

    res.json({
      success: true,
      match: {
        matchId: match.match_id,
        role,
        opponentId,
        opponentUsername,
        time,
      },
    });
  } catch (err) {
    console.error("[MATCH INFO] Error fetching match info:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch match info" });
  }
};
