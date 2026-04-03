const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { getDefinitions, getMyAchievements, getUserAchievements } = require("../controllers/achievementController")

router.get("/definitions", getDefinitions)
router.get("/", authToken, getMyAchievements)
router.get("/user/:userId", authToken, getUserAchievements)

module.exports = router
