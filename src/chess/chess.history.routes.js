// src/chess/chess.history.routes.js

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../auth/auth.middleware");
const { getChessMatchHistory } = require("./chess.history.controller");

router.get("/history", authMiddleware, getChessMatchHistory);

module.exports = router;
