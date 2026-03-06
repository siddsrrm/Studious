import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const Calendar = () => {
  const [events, setEvents] = useState([]);

  // Fetch events from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error loading events:", err));
  }, []);

  const handleDateClick = async (info) => {
    const title = prompt("Enter event title:");
    if (!title) return;

    const startInput = prompt(
      "Enter start date & time (YYYY-MM-DDTHH:MM)",
      info.dateStr + "T09:00",
    );
    if (!startInput) return;

    const endInput = prompt(
      "Enter end date & time (YYYY-MM-DDTHH:MM)",
      info.dateStr + "T10:00",
    );
    if (!endInput) return;

    const newEvent = {
      title,
      start: startInput,
      end: endInput,
    };

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });

      const savedEvent = await res.json();

      // update frontend state
      setEvents((prev) => [...prev, savedEvent]);
    } catch (err) {
      console.error("Error saving event:", err);
    }
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
      events={events}
      dateClick={handleDateClick}
    />
  );
};

export default Calendar;
