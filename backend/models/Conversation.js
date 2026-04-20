const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema({
  // attribute, type
  // ID can just be _id property of schema

  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  lastMessage: {
    content: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: { type: Date, default: Date.now }
})

// prevent duplicate conversations between the same pair of users
conversationSchema.index({ participants: 1 }, { unique: true })

module.exports = mongoose.model("Conversation", conversationSchema)
