const FriendRequest = require("../models/FriendRequest")
const User = require("../models/User")
const { emitToUser } = require("../socket")

// status: 0 = pending, 1 = accepted, 2 = declined

exports.sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body
    const senderId = req.user.userId

    if (senderId === recipientId) {
      return res.status(400).json({ message: "Cannot send a friend request to yourself" })
    }

    const existing = await FriendRequest.findOne({ sender: senderId, recipient: recipientId, status: { $in: [0, 1] } })
    if (existing) {
      return res.status(400).json({ message: "Friend request already sent" })
    }

    const fRequest = await FriendRequest.create({ sender: senderId, recipient: recipientId, status: 0 })
    const populated = await FriendRequest.findById(fRequest._id).populate("sender recipient", "username avatar")

    emitToUser(recipientId, "friend_request_received", populated, `${populated.sender.username} sent a friend request to ${populated.recipient.username}`)

    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: "Failed to send friend request" })
  }
}

exports.respondRequest = async (req, res) => {
  try {
    const { requestId } = req.params
    const { status } = req.body

    const fRequest = await FriendRequest.findById(requestId)
    if (!fRequest) {
      return res.status(404).json({ message: "Friend request not found" })
    }

    if (fRequest.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to respond to this request" })
    }

    fRequest.status = status
    await fRequest.save()

    if (status === 1) {
      const populated = await FriendRequest.findById(requestId).populate("sender recipient", "username avatar")
      emitToUser(fRequest.sender.toString(), "friend_request_accepted", populated, `${populated.recipient.username} accepted ${populated.sender.username}'s friend request`)
    } else if (status === 2) {
      const populated = await FriendRequest.findById(requestId).populate("sender recipient", "username avatar")
      await FriendRequest.deleteOne({ _id: requestId })
      emitToUser(fRequest.sender.toString(), "friend_request_declined", { requestId }, `${populated.recipient.username} declined ${populated.sender.username}'s friend request`)
      return res.json({ message: "Friend request declined" })
    }

    res.json({ message: `Friend request ${status === 1 ? "accepted" : "declined"}` })
  } catch (err) {
    res.status(500).json({ message: "Failed to respond to friend request" })
  }
}

exports.getSentRequests = async (req, res) => {
  try {
    const fRequests = await FriendRequest.find({ sender: req.user.userId, status: 0 })
      .populate("recipient", "username avatar")
    res.json(fRequests)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sent friend requests" });
  }
}

exports.getPendingRequests = async (req, res) => {
  try {
    const fRequests = await FriendRequest.find({ recipient: req.user.userId, status: 0 })
      .populate("sender", "username avatar")
    res.json(fRequests)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending friend requests" });
  }
}

exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params

    const fRequest = await FriendRequest.findById(requestId)
    if (!fRequest) {
      return res.status(404).json({ message: "Friend request not found" })
    }

    if (fRequest.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to cancel friend request" })
    }

    const populated = await FriendRequest.findById(requestId).populate("sender recipient", "username avatar")
    await FriendRequest.deleteOne({ _id: requestId })

    emitToUser(fRequest.recipient.toString(), "friend_request_cancelled", { requestId }, `${populated.sender.username} cancelled their request to ${populated.recipient.username}`)

    res.json({ message: "Friend request cancelled successfully" })
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel friend request" })
  }
}

exports.unfriend = async (req, res) => {
  try {
    const { requestId } = req.params

    const fRequest = await FriendRequest.findById(requestId)
    if (!fRequest) {
      return res.status(404).json({ message: "Friend request not found" })
    }

    const userId = req.user.userId
    const isSender = fRequest.sender.toString() === userId
    const isRecipient = fRequest.recipient.toString() === userId

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const populated = await FriendRequest.findById(requestId).populate("sender recipient", "username avatar")
    await FriendRequest.deleteOne({ _id: requestId })

    const otherUserId = isSender ? fRequest.recipient.toString() : fRequest.sender.toString()
    const actor = isSender ? populated.sender.username : populated.recipient.username
    const other = isSender ? populated.recipient.username : populated.sender.username
    emitToUser(otherUserId, "unfriended", { requestId, actorName: actor }, `${actor} unfriended ${other}`)

    res.json({ message: "Unfriended successfully" })
  } catch (err) {
    res.status(500).json({ message: "Failed to unfriend user" })
  }
}

exports.getFriends = async (req, res) => {
  try {
    const friends = await FriendRequest.find({
      $or: [{ sender: req.user.userId }, { recipient: req.user.userId }],
      status: 1
    }).populate("sender recipient", "username avatar")

    res.json(friends)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch friends list" })
  }
}
