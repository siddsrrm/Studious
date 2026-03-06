import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const Calendar = () => {
  const handleDateClick = (info) => {
    const title = prompt("Enter event title:");
    if (!title) return;

    // Prompt for start time (default to clicked date)
    const startInput = prompt(
      "Enter start date & time (YYYY-MM-DDTHH:MM), e.g., 2026-03-05T14:00",
      info.dateStr + "T09:00",
    );
    if (!startInput) return;

    // Prompt for end time (default 1 hour after start)
    const endInput = prompt(
      "Enter end date & time (YYYY-MM-DDTHH:MM), e.g., 2026-03-05T15:00",
      info.dateStr + "T10:00",
    );
    if (!endInput) return;

    info.view.calendar.addEvent({
      title,
      start: startInput,
      end: endInput,
    });
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={[]}
      dateClick={handleDateClick}
    />
  );
};

export default Calendar;
