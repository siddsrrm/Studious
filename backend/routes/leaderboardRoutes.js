const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { getLeaderboard, refreshLeaderboard } = require("../controllers/leaderboardController")

router.get("/", authToken, getLeaderboard);
router.post("/refresh", authToken, refreshLeaderboard);

module.exports = router;