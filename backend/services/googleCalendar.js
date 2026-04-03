const { google } = require("googleapis");

function getCalendarClient(accessToken, refreshToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.calendar({ version: "v3", auth });
}

async function createCalendarEvent(accessToken, refreshToken, event) {
  const calendar = getCalendarClient(accessToken, refreshToken);
  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: {
      summary: event.title,
      description: event.description || "",
      start: { 
        dateTime: new Date(event.start).toISOString(),
        timeZone: "UTC"
      },
      end: { 
        dateTime: new Date(event.end).toISOString(),
        timeZone: "UTC"
      },
    },
  });
  return response.data.id;
}
async function deleteCalendarEvent(accessToken, refreshToken, googleEventId) {
  const calendar = getCalendarClient(accessToken, refreshToken);
  await calendar.events.delete({
    calendarId: "primary",
    eventId: googleEventId,
  });
}

async function listCalendarEvents(accessToken, refreshToken, since) {
  const calendar = getCalendarClient(accessToken, refreshToken);
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: since || new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    timeMax : new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString()
  });
  return response.data.items || [];
}

async function updateCalendarEvent(accessToken, refreshToken, googleEventId, event) {
  const calendar = getCalendarClient(accessToken, refreshToken);
  await calendar.events.update({
    calendarId: "primary",
    eventId: googleEventId,
    resource: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
    },
  });
}

module.exports = { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, listCalendarEvents };
