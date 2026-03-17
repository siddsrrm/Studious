const Event = require("../models/Event");

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ ownerID: req.user.userId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = new Event({
      ownerID: req.user.userId,
      title: req.body.title,
      start: req.body.start,
      end: req.body.end,
    });

    const savedEvent = await event.save();
    res.json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });
    const { title, start, end } = req.body;
    if (title !== undefined) event.title = title;
    if (start !== undefined) event.start = start;
    if (end !== undefined) event.end = end;
    const updated = await event.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });
    await Event.deleteOne({ _id: event._id });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
