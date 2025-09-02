const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile } = require("./user.controller");
const { authMiddleware } = require("../auth/auth.middleware");

router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile/update", authMiddleware, updateUserProfile);

module.exports = router;
