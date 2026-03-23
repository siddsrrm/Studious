const FriendRequest = require("../models/FriendRequest")
const User = require("../models/User")

// status: 0 = pending, 1 = accepted, 2 = declined

exports.sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body
    const senderId = req.user.userId

    if (senderId === recipientId) {
      return res.status(400).json({ message: "Cannot send a friend request to yourself" })
    }

    const existing = await FriendRequest.findOne({ sender: senderId, recipient: recipientId })
    if (existing) { 
      return res.status(400).json({ message: "Friend request already sent" })
    }

    const fRequest = await FriendRequest.create({ sender: senderId, recipient: recipientId, status: 0 })

    res.json(fRequest)
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

    // check if the user is the recipient
    if (fRequest.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to respond to this request" })
    }

    fRequest.status = status
    await fRequest.save()
    res.json({ message: `Friend request ${status === 1 ? "accepted" : "declined"}` })
  } catch (err) {
    res.status(500).json({ message: "Failed to respond to friend request" })
  }
}

exports.getSentRequests = async (req, res) => {
  try {
    const fRequests = await FriendRequest.find({ sender: req.user.userId, status: 0 })
      .populate("recipient", "username")
    res.json(fRequests)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sent friend requests" });
  }
}

exports.getPendingRequests = async (req, res) => {
  try {
    const fRequests = await FriendRequest.find({ recipient: req.user.userId, status: 0 })
      .populate("sender", "username")
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

    await FriendRequest.deleteOne({ _id: requestId })
    res.json({ message: "Friend request cancelled successfully" })
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel friend request" })
  }
}

exports.getFriends = async (req, res) => {
  try {
    const friends = await FriendRequest.find({
      $or: [{ sender: req.user.userId }, { recipient: req.user.userId }],
      status: 1
    }).populate("sender recipient", "username")

    res.json(friends)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch friends list" })
  }
}