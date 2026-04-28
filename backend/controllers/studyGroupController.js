const Message = require("../models/Message")
const Note = require("../models/Note")
const User = require("../models/User")
const StudyGroup = require("../models/StudyGroup")
const { emitToUser } = require("../socket")
const { checkStudyGroupAchievements } = require("../services/achievementService")

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

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.find()
      .populate("members", "username avatar")
      .populate("createdBy", "username")
    res.json(groups)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups" })
  }
}

exports.getGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const group = await StudyGroup.findById(groupId)
      .populate("members", "username avatar")
      .populate("createdBy", "username")
      .populate("joinRequests", "username avatar")
    if (!group) return res.status(404).json({ message: "Group not found" })
    res.json(group)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group" })
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
    await group.populate("members", "username avatar")

    const newMember = group.members.find(m => m._id.toString() === userId)
    group.members.forEach(m => {
      emitToUser(m._id.toString(), "group_member_joined", {
        groupId,
        member: { _id: newMember._id, username: newMember.username, avatar: newMember.avatar }
      })
    })

    checkStudyGroupAchievements(userId)
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

    group.members.forEach(m => {
      emitToUser(m.toString(), "group_member_removed", { groupId, userId })
    })

    group.members = group.members.filter(m => m.toString() !== userId)
    await group.save()

    res.json(group)
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member" })
  }
}

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const requesterId = req.user.userId

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    if (group.createdBy.toString() !== requesterId)
      return res.status(403).json({ message: "Only the owner can delete the group" })

    // notify all members before deleting
    group.members.forEach(m => {
      emitToUser(m.toString(), "group_deleted", { groupId, groupName: group.name })
    })

    await Message.deleteMany({ groupId })
    await Note.updateMany({ groupIds: groupId }, { $pull: { groupIds: groupId } })
    await StudyGroup.deleteOne({ _id: groupId })

    res.json({ message: "Group deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete group" })
  }
}

exports.updatePrivacy = async (req, res) => {
  try {
    const { groupId } = req.params
    const { privacy } = req.body
    const requesterId = req.user.userId

    if (!["open", "request"].includes(privacy))
      return res.status(400).json({ message: "Invalid privacy value" })

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    if (group.createdBy.toString() !== requesterId)
      return res.status(403).json({ message: "Only the owner can change privacy" })

    group.privacy = privacy
    await group.save()

    group.members.forEach(m => {
      emitToUser(m.toString(), "group_privacy_changed", { groupId, privacy })
    })

    res.json({ privacy: group.privacy })
  } catch (err) {
    res.status(500).json({ message: "Failed to update privacy" })
  }
}

// join requests
exports.requestToJoin = async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    if (group.members.map(m => m.toString()).includes(userId))
      return res.status(400).json({ message: "Already a member" })

    // open group — join immediately
    if (group.privacy === "open") {
      group.members.push(userId)
      await group.save()
      await group.populate("members", "username avatar")

      const newMember = group.members.find(m => m._id.toString() === userId)
      group.members
        .filter(m => m._id.toString() !== userId)
        .forEach(m => {
          emitToUser(m._id.toString(), "group_member_joined", {
            groupId,
            member: { _id: newMember._id, username: newMember.username, avatar: newMember.avatar }
          })
        })

      checkStudyGroupAchievements(userId)
      return res.json({ message: "Joined", joined: true })
    }

    // request-only group
    if (group.joinRequests.map(r => r.toString()).includes(userId))
      return res.status(400).json({ message: "Request already sent" })

    group.joinRequests.push(userId)
    await group.save()

    const requester = await User.findById(userId).select("username avatar")
    emitToUser(group.createdBy.toString(), "group_join_request", {
      groupId,
      groupName: group.name,
      user: { _id: requester._id, username: requester.username, avatar: requester.avatar }
    })

    res.json({ message: "Request sent", joined: false })
  } catch (err) {
    res.status(500).json({ message: "Failed to send join request" })
  }
}

exports.acceptJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params
    const requesterId = req.user.userId

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    if (group.createdBy.toString() !== requesterId)
      return res.status(403).json({ message: "Only the owner can accept requests" })

    group.joinRequests = group.joinRequests.filter(r => r.toString() !== userId)
    group.members.push(userId)
    await group.save()

    await group.populate("members", "username avatar")
    await group.populate("joinRequests", "username avatar")

    const newMember = group.members.find(m => m._id.toString() === userId)

    checkStudyGroupAchievements(userId)

    // notify the accepted user
    emitToUser(userId, "group_request_accepted", { groupId, groupName: group.name })

    // notify all other members
    group.members
      .filter(m => m._id.toString() !== userId && m._id.toString() !== requesterId)
      .forEach(m => {
        emitToUser(m._id.toString(), "group_member_joined", {
          groupId,
          member: { _id: newMember._id, username: newMember.username, avatar: newMember.avatar }
        })
      })

    res.json(group)
  } catch (err) {
    res.status(500).json({ message: "Failed to accept request" })
  }
}

exports.declineJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params
    const requesterId = req.user.userId

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    if (group.createdBy.toString() !== requesterId)
      return res.status(403).json({ message: "Only the owner can decline requests" })

    group.joinRequests = group.joinRequests.filter(r => r.toString() !== userId)
    await group.save()

    emitToUser(userId, "group_request_declined", { groupId, groupName: group.name })

    res.json({ message: "Request declined" })
  } catch (err) {
    res.status(500).json({ message: "Failed to decline request" })
  }
}

// messages
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("senderId", "username")

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

    const notes = await Note.find({ groupIds: groupId }).populate("ownerID", "username")

    res.json(notes)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group notes" })
  }
}

exports.createGroupNote = async (req, res) => {
  try {
    const { groupId } = req.params
    const { noteId } = req.body

    const group = await StudyGroup.findById(groupId)
    if (!group) return res.status(404).json({ message: "Group not found" })

    const isMember = group.members.map(m => m.toString()).includes(req.user.userId)
    if (!isMember) return res.status(403).json({ message: "Not a member of this group" })

    const note = await Note.findByIdAndUpdate(
      noteId,
      { $addToSet: { groupIds: groupId } },
      { new: true }
    ).populate("ownerID", "username")
    if (!note) return res.status(404).json({ message: "Note not found" })

    group.members
      .filter(m => m.toString() !== req.user.userId)
      .forEach(m => {
        emitToUser(m.toString(), "group_note_shared", { groupId, note })
      })

    res.status(201).json(note)
  } catch (err) {
    res.status(500).json({ message: "Failed to share note" })
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

    await Note.findByIdAndUpdate(noteId, { $pull: { groupIds: group._id } })

    group.members
      .filter(m => m.toString() !== req.user.userId)
      .forEach(m => {
        emitToUser(m.toString(), "group_note_removed", { groupId, noteId })
      })

    res.json({ message: "Note removed from group" })
  } catch (err) {
    res.status(500).json({ message: "Failed to remove group note" })
  }
}
