const Event = require("../models/Event");
const User = require("../models/User");
const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../services/googleCalendar");

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
      rrule: req.body.rrule || null,
      duration: req.body.duration || null,
    });
    const savedEvent = await event.save();

    // Sync to Google Calendar if connected
    const user = await User.findById(req.user.userId);
    if (user.googleCalendarConnected) {
      const googleEventId = await createCalendarEvent(
        user.googleAccessToken,
        user.googleRefreshToken,
        {
          title: savedEvent.title,
          description: savedEvent.description,
          start: savedEvent.start,
          end: savedEvent.end,
        },
      );
      savedEvent.googleEventId = googleEventId;
      await savedEvent.save();
    }
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

    const { title, start, end, rrule, duration } = req.body;

    if (title !== undefined) event.title = title;
    if (start !== undefined) event.start = start;
    if (end !== undefined) event.end = end;
    if (rrule !== undefined) event.rrule = rrule;
    if (duration !== undefined) event.duration = duration;

    const updated = await event.save();

    // Sync update to Google Calendar if connected
    const user = await User.findById(req.user.userId);
    if (user.googleCalendarConnected && event.googleEventId) {
      await updateCalendarEvent(
        user.googleAccessToken,
        user.googleRefreshToken,
        event.googleEventId,
        {
          title: updated.title,
          description: updated.description,
          start: updated.start,
          end: updated.end,
        },
      );
    }
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

    // Delete from Google Calendar if connected
    const user = await User.findById(req.user.userId);
    if (user.googleCalendarConnected && event.googleEventId) {
      try {
        await deleteCalendarEvent(
          user.googleAccessToken,
          user.googleRefreshToken,
          event.googleEventId,
        );
      } catch (googleErr) {
        console.log(
          "Google Calendar delete failed (event may already be deleted):",
          googleErr.message,
        );
        // continue anyway
      }
    }
    await Event.deleteOne({ _id: event._id });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
