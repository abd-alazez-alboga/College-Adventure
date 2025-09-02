// src/chess/data/match.repo.js
const pool = require("../../config/db");

/**
 * Read a match by ID.
 * If opts.withPlayers === true, also attach:
 *   match.player_white = { user_id, username, elo_chess }
 *   match.player_black = { user_id, username, elo_chess }
 */
async function getMatch(matchId, opts = {}) {
  const { rows } = await pool.query(
    `SELECT
       matchid,
       game_type,
       player1_id,
       player2_id,
       winner_id,
       moves,
       duration_seconds,
       created_at,
       start_time,
       status,
       white_time_left,
       black_time_left,
       increment,
       delay,
       elo_change_p1,
       elo_change_p2,
       score_player1,
       score_player2
     FROM match
     WHERE matchid = $1
     LIMIT 1`,
    [matchId]
  );
  const match = rows[0] || null;
  if (!match) return null;

  // Ensure moves is an array
  if (!Array.isArray(match.moves)) match.moves = [];

  // Debug: surface what we loaded for player IDs
  try {
    console.log(
      `[DB] getMatch matchId=${matchId} p1=${
        match.player1_id
      } (type=${typeof match.player1_id}) p2=${
        match.player2_id
      } (type=${typeof match.player2_id})`
    );
  } catch {}

  if (opts.withPlayers) {
    const { rows: users } = await pool.query(
      `SELECT
         userid   AS user_id,
         username,
         elochess AS elo_chess
       FROM "user"
       WHERE userid = $1 OR userid = $2`,
      [match.player1_id, match.player2_id]
    );

    const p1 = users.find((u) => u.user_id === match.player1_id) || null; // white
    const p2 = users.find((u) => u.user_id === match.player2_id) || null; // black
    match.player_white = p1;
    match.player_black = p2;
  }

  return match;
}

/**
 * Create a new match.
 * Stores initial time and increment.
 */
async function createMatch({
  matchId,
  player1Id,
  player2Id,
  baseMs,
  incrementSeconds,
}) {
  await pool.query(
    `INSERT INTO match (
       matchid,
       game_type,
       player1_id,
       player2_id,
       status,
       white_time_left,
       black_time_left,
       increment
     )
     VALUES ($1, 'chess', $2, $3, 'active', $4, $4, $5)`,
    [matchId, player1Id, player2Id, baseMs, incrementSeconds || 0]
  );
}

/** Mark that the match officially started (set start_time = now). */
async function setStarted(matchId) {
  await pool.query(
    `UPDATE match SET start_time = CURRENT_TIMESTAMP WHERE matchid = $1`,
    [matchId]
  );
}

/**
 * Finish the match and store final result.
 */
async function updateOnFinish({
  matchId,
  winnerId,
  movesJson,
  durationSeconds,
  whiteTimeLeft,
  blackTimeLeft,
  status,
}) {
  await pool.query(
    `UPDATE match
     SET
       winner_id        = $1,
       moves            = $2::jsonb,
       duration_seconds = $3,
       white_time_left  = $4,
       black_time_left  = $5,
       status           = $6
     WHERE matchid = $7`,
    [
      winnerId,
      movesJson,
      durationSeconds,
      whiteTimeLeft,
      blackTimeLeft,
      status,
      matchId,
    ]
  );
}

/** Convenience: update status only */
async function setStatus(matchId, status) {
  await pool.query(`UPDATE match SET status = $1 WHERE matchid = $2`, [
    status,
    matchId,
  ]);
}

module.exports = {
  getMatch,
  createMatch,
  setStarted,
  updateOnFinish,
  setStatus,
};
