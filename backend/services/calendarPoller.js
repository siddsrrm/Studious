const User = require("../models/User");
const Event = require("../models/Event");
const { listCalendarEvents } = require("./googleCalendar");

async function pollCalendarForAllUsers() {
  try {
    console.log("polling calendars");
    const users = await User.find({ googleCalendarConnected: true });

    for (const user of users) {
      const googleEvents = await listCalendarEvents(
        user.googleAccessToken,
        user.googleRefreshToken,
        new Date(Date.now() - 10 * 60 * 1000).toISOString()
      );

      for (const gEvent of googleEvents) {
        // Skip if we already have this event
        console.log("Adding event...");
        const exists = await Event.findOne({ googleEventId: gEvent.id });
        if (exists) {
            console.log("event already exists");
            continue; }

        // Save new event from Google Calendar
        await Event.create({
          ownerID: user._id,
          title: gEvent.summary || "Untitled",
          description: gEvent.description || "",
           start: new Date(gEvent.start.dateTime || gEvent.start.date).toISOString(),
  end: new Date(gEvent.end.dateTime || gEvent.end.date).toISOString(),
  googleEventId: gEvent.id,
        });
        console.log("event added");
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  }
}

module.exports = { pollCalendarForAllUsers };