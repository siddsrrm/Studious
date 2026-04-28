const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { searchNotes, getAllMyNotes, getNotes, createNote, updateNote, deleteNote } = require("../controllers/noteController")

router.get("/search", authToken, searchNotes)
router.get("/all", authToken, getAllMyNotes)
router.get("/", authToken, getNotes)
router.post("/", authToken, createNote)
router.put("/:id", authToken, updateNote)
router.delete("/:id", authToken, deleteNote)

module.exports = router