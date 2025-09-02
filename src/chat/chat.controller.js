const {
  ensureGeneralRoom,
  createMessage,
  listMessages,
} = require("./data/chat.repo");

exports.getGeneralMessages = async (req, res) => {
  try {
    // For cafeteria chat, return empty messages since history is discarded
    // when users leave the cafeteria
    res.json({ roomId: 'general', messages: [] });
  } catch (e) {
    console.error("getGeneralMessages error", e);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

exports.postGeneralMessage = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { content } = req.body || {};
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ message: "Content is required" });
    }
    
    // For cafeteria chat, messages are only sent via WebSocket
    // HTTP endpoint is kept for compatibility but doesn't store messages
    const msg = {
      id: Date.now() + Math.random(),
      room_id: 'general',
      user_id: userId,
      content: content.trim(),
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(msg);
  } catch (e) {
    console.error("postGeneralMessage error", e);
    res.status(500).json({ message: "Failed to post message" });
  }
};
