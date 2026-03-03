const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { searchNotes } = require("../controllers/noteController")

router.get("/search", authToken, searchNotes)

module.exports = router