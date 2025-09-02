// src/user/user.controller.js
const pool = require("../config/db");

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT userid, username, displayname, language, cosmeticdata, elochess, elo_pingpong
       FROM "user"
       WHERE userid = $1`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const userId = req.user.userId;
  const { displayName, language, cosmeticData } = req.body;

  try {
    await pool.query(
      `UPDATE "user"
       SET displayname = $1,
           language = $2,
           cosmeticdata = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE userid = $4`,
      [displayName, language, cosmeticData, userId]
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
