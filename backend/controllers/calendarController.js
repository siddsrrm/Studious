const Calendar = require("../models/Calendar");

exports.getEvents = async (req, res) => {
  try {
    const events = await Calendar.find({ userId: req.user.id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = new Calendar({
      title: req.body.title,
      date: req.body.date,
      description: req.body.description,
      userId: req.user.id
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
