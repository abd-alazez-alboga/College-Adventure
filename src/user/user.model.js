// src/user/user.model.js
const pool = require("../config/db");

const createUser = async (username, email, hash) => {
  const res = await pool.query(
    `INSERT INTO "user" (username, email, passwordhash)
     VALUES ($1, $2, $3) RETURNING *`,
    [username, email, hash]
  );
  return res.rows[0];
};

const findUserByEmail = async (email) => {
  const res = await pool.query(`SELECT * FROM "user" WHERE email = $1`, [
    email,
  ]);
  return res.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
};
