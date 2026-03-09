const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const { getEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");

router.get("/", authToken, getEvents);
router.post("/", authToken, createEvent);
router.put("/:id", authToken, updateEvent);
router.delete("/:id", authToken, deleteEvent);

module.exports = router;