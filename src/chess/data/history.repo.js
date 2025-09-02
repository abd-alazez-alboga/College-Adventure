// src/chess/data/history.repo.js
const pool = require("../../config/db");

/**
 * Insert a row into user_matches.
 * 'moves' should be a JS array; we send as JSONB.
 */
async function insertUserMatch({
  userId,
  matchId,
  role, // 'white' | 'black'
  result, // 'win' | 'loss' | 'draw'
  eloBefore,
  eloAfter,
  opponentId,
  opponentUsername,
  opponentEloBefore,
  opponentEloAfter,
  durationSeconds,
  moves, // JS array
}) {
  await pool.query(
    `INSERT INTO user_matches (
       user_id,
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
     ) VALUES (
       $1,$2,$3,$4,$5,$6,
       $7,$8,$9,$10,$11,
       $12::jsonb, CURRENT_TIMESTAMP
     )`,
    [
      userId,
      matchId,
      role,
      result,
      eloBefore,
      eloAfter,
      opponentId,
      opponentUsername,
      opponentEloBefore,
      opponentEloAfter,
      durationSeconds,
      JSON.stringify(moves || []),
    ]
  );
}

module.exports = { insertUserMatch };
