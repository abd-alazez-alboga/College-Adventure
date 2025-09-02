// src/chess/chess.replay.routes.js

const express = require("express");
const router = express.Router();
const { getReplay } = require("./chess.replay.controller");

router.get("/replay/:matchId", getReplay);

module.exports = router;
