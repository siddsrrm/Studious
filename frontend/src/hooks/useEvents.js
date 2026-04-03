import { useState, useEffect } from "react";
import { RRule } from "rrule";

const API = import.meta.env.VITE_API_URL;

export const useEvents = () => {
  const [events, setEvents] = useState([]);

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
        setEvents(data);
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
      setEvents((prev) => [...prev, saved]);
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
      setEvents((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e)),
      );
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
