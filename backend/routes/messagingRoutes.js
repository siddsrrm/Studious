const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { getConversations, getOrCreateConversation } = require("../controllers/conversationController")
const { getMessages, sendMessage, markAsRead } = require("../controllers/messageController")

router.get("/conversations", authToken, getConversations)
router.post("/conversations", authToken, getOrCreateConversation)
router.get("/conversations/:conversationId/messages", authToken, getMessages)
router.post("/conversations/:conversationId/messages", authToken, sendMessage)
router.put("/conversations/:conversationId/read", authToken, markAsRead)

module.exports = router
