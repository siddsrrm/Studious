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

    // find convo
    let convo = await Conversation.findOne({
      participants: { $all: [userId, friendId], $size: 2 }
    }).populate("participants", "username avatar")

    if (!convo) { // if not found, create
      convo = await Conversation.create({ participants: [userId, friendId] })
      convo = await convo.populate("participants", "username avatar")
    }

    res.json(convo)
  } catch (err) {
    console.log(err) // for debugging
    res.status(500).json({ message: "Failed to fetch or create conversation" })
  }
}
