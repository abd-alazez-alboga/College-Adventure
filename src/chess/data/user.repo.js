// src/chess/data/user.repo.js
const pool = require("../../config/db");

/** Get minimal user rows by ids (two ids). */
async function getUsersByIds(idA, idB) {
  const { rows } = await pool.query(
    `SELECT
       userid   AS user_id,
       username,
       elochess AS elo_chess,
       last_color_played
     FROM "user"
     WHERE userid = $1 OR userid = $2`,
    [idA, idB]
  );
  return rows;
}

/** Get one user by id (minimal fields). */
async function getUserById(userId) {
  const { rows } = await pool.query(
    `SELECT
       userid   AS user_id,
       username,
       elochess AS elo_chess,
       last_color_played
     FROM "user"
     WHERE userid = $1
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/** Update Elo for a user to an absolute value. */
async function setUserElo(userId, newElo) {
  await pool.query(`UPDATE "user" SET elochess = $1 WHERE userid = $2`, [
    newElo,
    userId,
  ]);
}

/** Update last color played: 'white' | 'black' | NULL */
async function setLastColor(userId, colorOrNull) {
  await pool.query(
    `UPDATE "user" SET last_color_played = $1 WHERE userid = $2`,
    [colorOrNull, userId]
  );
}

module.exports = {
  getUsersByIds,
  getUserById,
  setUserElo,
  setLastColor,
};
