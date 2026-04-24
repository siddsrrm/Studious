const Message = require("../models/Message")
const Conversation = require("../models/Conversation")

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 })

    res.json(messages)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { content } = req.body
    const senderId = req.user.userId

    const newMsg = await Message.create({ conversationId, senderId, content })

    const convo = await Conversation.findById(conversationId)
    const recipientId = convo.participants.find(p => p.toString() !== senderId).toString()

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: { content, senderId, createdAt: new Date() },
      $inc: { [`unreadCount.${recipientId}`]: 1 }
    })

    res.json(newMsg)
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.userId

    await Conversation.findByIdAndUpdate(conversationId, {
      $unset: { [`unreadCount.${userId}`]: "" }
    })

    res.json({ message: "Marked as read" })
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read" })
  }
}
