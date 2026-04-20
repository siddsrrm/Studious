const Conversation = require("../models/Conversation")

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId

    const convos = await Conversation.find({ participants: userId })
      .populate("participants", "username avatar")

    res.json(convos)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations" })
  }
}

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.userId
    const { friendId } = req.body

    const convo = await Conversation.findOneAndUpdate(
      { participants: { $all: [userId, friendId] } },
      { $setOnInsert: { participants: [userId, friendId] } },
      { upsert: true, new: true }
    )

    res.json(convo)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch or create conversation" })
  }
}
