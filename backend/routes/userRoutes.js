const express = require("express")
const router = express.Router()
const { nameChange, deleteAccount, emailChange, getInfo } = require("../controllers/userController")
const authToken = require("../middleware/authMiddleware")

router.post("/nameChange", authToken, nameChange)
router.post("/delete", authToken, deleteAccount)
router.post("/emailChange", authToken, emailChange)
router.get("/me", authToken, getInfo)

module.exports = router