const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const {
  createGroup,
  getAllGroups,
  getGroup,
  getGroups,
  addMember,
  removeMember,
  deleteGroup,
  requestToJoin,
  acceptJoinRequest,
  declineJoinRequest,
  getMessages,
  sendMessage,
  markAsRead,
  getGroupNotes,
  createGroupNote,
  updateGroupNote,
  deleteGroupNote
} = require("../controllers/studyGroupController")

router.post("/", authToken, createGroup)
router.get("/", authToken, getGroups)
router.get("/all", authToken, getAllGroups)
router.get("/:groupId", authToken, getGroup)
router.delete("/:groupId", authToken, deleteGroup)
router.post("/:groupId/members", authToken, addMember)
router.delete("/:groupId/members/:userId", authToken, removeMember)
router.post("/:groupId/join", authToken, requestToJoin)
router.post("/:groupId/join/:userId/accept", authToken, acceptJoinRequest)
router.post("/:groupId/join/:userId/decline", authToken, declineJoinRequest)
router.get("/:groupId/messages", authToken, getMessages)
router.post("/:groupId/messages", authToken, sendMessage)
router.put("/:groupId/read", authToken, markAsRead)
router.get("/:groupId/notes", authToken, getGroupNotes)
router.post("/:groupId/notes", authToken, createGroupNote)
router.put("/:groupId/notes/:noteId", authToken, updateGroupNote)
router.delete("/:groupId/notes/:noteId", authToken, deleteGroupNote)

module.exports = router