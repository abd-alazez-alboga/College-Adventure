const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../auth/auth.middleware');
const {
  getGeneralMessages,
  postGeneralMessage,
} = require('./chat.controller');

router.get('/general/messages', authMiddleware, getGeneralMessages);
router.post('/general/messages', authMiddleware, postGeneralMessage);

module.exports = router;


