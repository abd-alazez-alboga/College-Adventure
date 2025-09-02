// src/chess/chess.match.info.routes.js

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../auth/auth.middleware");
const { getMatchInfo } = require("./chess.match.info.controller");

router.get("/matchInfo", authMiddleware, getMatchInfo);

module.exports = router;
