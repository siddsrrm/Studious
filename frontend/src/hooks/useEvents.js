import { useState, useEffect } from "react";
import { RRule } from "rrule";

const API = import.meta.env.VITE_API_URL;

export const useEvents = () => {
  const [events, setEvents] = useState([]);

  const normalizeEvent = (e) => {
    if (e.recurrence && e.recurrence.freq) {
      const duration = (new Date(e.end) - new Date(e.start)) / (1000 * 60);

      const rrule = new RRule({
        freq: RRule[e.recurrence.freq.toUpperCase()],
        interval: e.recurrence.interval || 1,
        dtstart: new Date(e.start),
        until: e.recurrence.until ? new Date(e.recurrence.until) : undefined,
      });

      // Generate only next 90 days
      const now = new Date();
      const ninetyDaysLater = new Date(
        now.getTime() + 90 * 24 * 60 * 60 * 1000,
      );
      const dates = rrule.between(now, ninetyDaysLater, true);

      return dates.map((date) => ({
        _id: `${e._id}-${date.getTime()}`,
        title: e.title,
        start: date,
        end: new Date(date.getTime() + duration * 60 * 1000),
      }));
    }

    return [{ ...e, start: new Date(e.start), end: new Date(e.end) }];
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        const allEvents = data.flatMap(normalizeEvent); // flatten arrays
        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to load events");
      }
    })();
  }, []);

  // Create
  const createEvent = async (form) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setEvents((prev) => [...prev, { ...form, _id: Date.now().toString() }]);
      return;
    }

    try {
      const res = await fetch(`${API}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const saved = await res.json();
      const occurrences = Array.isArray(normalizeEvent(saved))
        ? normalizeEvent(saved)
        : [normalizeEvent(saved)];

      setEvents((prev) => [...prev, ...occurrences]);
    } catch {
      console.error("Failed to create event");

      // fallback
      setEvents((prev) => [...prev, { ...form, _id: Date.now().toString() }]);
    }
  };

  // Edit
  const editEvent = async (eventId, form) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const updated = await res.json();
      const occurrences = Array.isArray(normalizeEvent(updated))
        ? normalizeEvent(updated)
        : [normalizeEvent(updated)];

      setEvents((prev) => [
        ...prev.filter((e) => !e._id.startsWith(updated._id)),
        ...occurrences,
      ]);
    } catch {
      console.error("Failed to update event");

      // fallback
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, ...form } : e)),
      );
    }
  };

  // Delete
  const deleteEvent = async (eventId) => {
    const token = localStorage.getItem("token");

    try {
      await fetch(`${API}/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      console.error("Failed to delete event");
    }

    // always update UI
    setEvents((prev) => prev.filter((e) => e._id !== eventId));
  };

  return {
    events,
    createEvent,
    editEvent,
    deleteEvent,
  };
};
