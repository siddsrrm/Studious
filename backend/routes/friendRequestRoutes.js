const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { sendRequest, respondRequest, getSentRequests, getPendingRequests, cancelRequest, getFriends, unfriend } = require("../controllers/friendRequestController")

router.post("/", authToken, sendRequest)
router.put("/:requestId", authToken, respondRequest)
router.get("/sent", authToken, getSentRequests)
router.get("/pending", authToken, getPendingRequests)
router.delete("/:requestId", authToken, cancelRequest)
router.get("/friends", authToken, getFriends)
router.delete("/unfriend/:requestId", authToken, unfriend)

module.exports = router