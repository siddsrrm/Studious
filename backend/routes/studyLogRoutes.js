const express = require("express");
const router = express.Router();
const { getLogs, updateLogs } = require("../controllers/studyLogController");
const authToken = require("../middleware/authMiddleware")

router.post("/", authToken, updateLogs);
router.get("/", authToken, getLogs);

module.exports = router;