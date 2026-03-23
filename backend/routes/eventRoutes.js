const express = require("express");
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, getEvents);
router.post("/", auth, createEvent);
router.put("/:id", auth, updateEvent);
router.delete("/:id", auth, deleteEvent);

module.exports = router;