const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { getMyAchievements, getUserAchievements } = require("../controllers/achievementController")

router.get("/", authToken, getMyAchievements)
router.get("/user/:userId", authToken, getUserAchievements)

module.exports = router
