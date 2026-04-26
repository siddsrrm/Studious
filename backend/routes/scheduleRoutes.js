const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../controllers/scheduleController");
const auth = require("../middleware/authMiddleware");

router.post("/generate", auth, generateSchedule);

module.exports = router;
