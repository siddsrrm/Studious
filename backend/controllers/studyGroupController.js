const Message = require("../models/Message")
const Note = require("../models/Note")
const User = require("../models/User")
const StudyGroup = require("../models/StudyGroup")
const { emitToUser } = require("../socket")

// group management
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body
    const userId = req.user.userId

    const group = await StudyGroup.create({
      name,
      createdBy: userId,
      members: [userId]
    })

    res.status(201).json(group)
  } catch (err) {
    res.status(500).json({ message: "Failed to create group" })
  }
}

exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.userId

    const groups = await StudyGroup.find({ members: userId })
      .populate("members", "username avatar")
      .populate("createdBy", "username")

    res.json(groups)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups" })
  }
}

exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params
    const { userId } = req.body

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    if (group.members.map(m => m.toString()).includes(userId)) {
      return res.status(400).json({ message: "User is already a member" })
    }

    group.members.push(userId)
    await group.save()

    res.json(group)
  } catch (err) {
    res.status(500).json({ message: "Failed to add member" })
  }
}

exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params
    const requesterId = req.user.userId

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    const isCreator = group.createdBy.toString() === requesterId
    const isSelf = userId === requesterId

    if (!isCreator && !isSelf) {
      return res.status(403).json({ message: "Not authorized" })
    }

    group.members = group.members.filter(m => m.toString() !== userId)
    await group.save()

    res.json(group)
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member" })
  }
}

// messages
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params

    const messages = await Message.find({ groupId }).sort({ createdAt: 1 })

    res.json(messages)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params
    const { content } = req.body
    const senderId = req.user.userId

    const newMsg = await Message.create({ groupId, senderId, content })

    const [sender, group] = await Promise.all([
      User.findById(senderId).select("username"),
      StudyGroup.findById(groupId)
    ])

    group.members
      .filter(memberId => memberId.toString() !== senderId)
      .forEach(memberId => {
        emitToUser(memberId.toString(), "group_message_received", {
          _id: newMsg._id,
          groupId,
          senderId,
          content,
          createdAt: newMsg.createdAt,
          senderUsername: sender.username
        })
      })

    res.json(newMsg)
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    await StudyGroup.findByIdAndUpdate(groupId, {
      $unset: { [`unreadCount.${userId}`]: "" }
    })

    res.json({ message: "Marked as read" })
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read" })
  }
}

// shared notes
exports.getGroupNotes = async (req, res) => {
  try {
    const { groupId } = req.params

    const notes = await Note.find({ groupId }).populate("ownerID", "username")

    res.json(notes)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group notes" })
  }
}

exports.createGroupNote = async (req, res) => {
  try {
    const { groupId } = req.params
    const { title, content, tags } = req.body

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    const isMember = group.members.map(m => m.toString()).includes(req.user.userId)
    if (!isMember) return res.status(403).json({ message: "Not a member of this group" })

    const note = await Note.create({
      ownerID: req.user.userId,
      groupId,
      title: title || "Untitled",
      content: content || "",
      tags: tags || []
    })

    res.status(201).json(note)
  } catch (err) {
    res.status(500).json({ message: "Failed to create group note" })
  }
}

exports.updateGroupNote = async (req, res) => {
  try {
    const { groupId, noteId } = req.params

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    const isMember = group.members.map(m => m.toString()).includes(req.user.userId)
    if (!isMember) return res.status(403).json({ message: "Not a member of this group" })

    const note = await Note.findById(noteId)
    if (!note) return res.status(404).json({ message: "Note not found" })

    const updated = await note.updateNote(req.body)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: "Failed to update group note" })
  }
}

exports.deleteGroupNote = async (req, res) => {
  try {
    const { groupId, noteId } = req.params

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    const isMember = group.members.map(m => m.toString()).includes(req.user.userId)
    if (!isMember) return res.status(403).json({ message: "Not a member of this group" })

    const note = await Note.findById(noteId)
    if (!note) return res.status(404).json({ message: "Note not found" })

    await Note.deleteOne({ _id: note._id })
    res.json({ message: "Note deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete group note" })
  }
}
