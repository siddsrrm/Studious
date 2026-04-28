const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const {
  createGroup,
  getGroups,
  addMember,
  removeMember,
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
router.post("/:groupId/members", authToken, addMember)
router.delete("/:groupId/members/:userId", authToken, removeMember)
router.get("/:groupId/messages", authToken, getMessages)
router.post("/:groupId/messages", authToken, sendMessage)
router.put("/:groupId/read", authToken, markAsRead)
router.get("/:groupId/notes", authToken, getGroupNotes)
router.post("/:groupId/notes", authToken, createGroupNote)
router.put("/:groupId/notes/:noteId", authToken, updateGroupNote)
router.delete("/:groupId/notes/:noteId", authToken, deleteGroupNote)

module.exports = router