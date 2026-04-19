const express = require("express");
const router = express.Router();
const { generateSchedule, bulkCreateEvents } = require("../controllers/scheduleController");
const auth = require("../middleware/authMiddleware");

router.post("/generate", auth, generateSchedule);
router.post("/bulk-create", auth, bulkCreateEvents);

module.exports = router;
