const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const event = new Event({
      title: req.body.title,
      start: req.body.start,
      end: req.body.end,
    });

    const savedEvent = await event.save();
    res.json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;