const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  // attribute, type
  // ID can just be _id property of schema

  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup", default: null }
})

module.exports = mongoose.model("Message", messageSchema)
