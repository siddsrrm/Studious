const express = require("express")
const router = express.Router()
const { nameChange, deleteAccount } = require("../controllers/userController")
const authToken = require("../middleware/authMiddleware")

router.post("/nameChange", authToken, nameChange)
router.post("/delete", authToken, deleteAccount)

module.exports = router