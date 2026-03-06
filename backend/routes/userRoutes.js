const express = require("express")
const router = express.Router()
const { nameChange, deleteAccount, emailChange, toggle2FA, getInfo } = require("../controllers/userController")
const authToken = require("../middleware/authMiddleware")

router.post("/nameChange", authToken, nameChange)
router.post("/delete", authToken, deleteAccount)
router.post("/emailChange", authToken, emailChange)
router.post("/toggle2FA", authToken, toggle2FA);
router.get("/me", authToken, getInfo)

module.exports = router