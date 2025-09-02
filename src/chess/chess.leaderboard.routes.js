// src/chess/chess.leaderboard.routes.js

const express = require("express");
const router = express.Router();
const { getChessLeaderboard } = require("./chess.leaderboard.controller");

router.get("/leaderboard", getChessLeaderboard);

module.exports = router;
