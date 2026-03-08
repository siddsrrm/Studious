import React, { useState, useEffect } from "react";
import "../css/Calendar.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const Calendar = () => {
  const [events, setEvents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    start: "",
    end: "",
  });

  const token = localStorage.getItem("token");

  // Fetch events
  useEffect(() => {
    fetch("http://localhost:5000/api/calendar", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) =>
        setEvents(
          data.map((event) => ({
            id: event._id,
            title: event.title,
            start: event.start,
            end: event.end,
          })),
        ),
      )
      .catch((err) => console.error("Error loading events:", err));
  }, [token]);

  // Click date → open create modal
  const handleDateClick = (info) => {
    setEditingEventId(null);

    setFormData({
      title: "",
      start: info.dateStr + "T09:00",
      end: info.dateStr + "T10:00",
    });

    setShowModal(true);
  };

  // Click event → open edit modal
  const handleEventClick = (info) => {
    setEditingEventId(info.event.id);

    setFormData({
      title: info.event.title,
      start: info.event.start.toISOString().slice(0, 16),
      end: info.event.end
        ? info.event.end.toISOString().slice(0, 16)
        : info.event.start.toISOString().slice(0, 16),
    });

    setShowModal(true);
  };

  // Delete event
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;

    try {
      await fetch(`http://localhost:5000/api/calendar/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  // Form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit create/edit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = editingEventId ? "PUT" : "POST";
    const url = editingEventId
      ? `http://localhost:5000/api/calendar/${editingEventId}`
      : "http://localhost:5000/api/calendar";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const saved = await res.json();

      if (editingEventId) {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === saved._id
              ? {
                  id: saved._id,
                  title: saved.title,
                  start: saved.start,
                  end: saved.end,
                }
              : event,
          ),
        );
      } else {
        setEvents((prev) => [
          ...prev,
          {
            id: saved._id,
            title: saved.title,
            start: saved.start,
            end: saved.end,
          },
        ]);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error saving event:", err);
    }
  };

  return (
    <div>
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
        eventClick={handleEventClick}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEventId ? "Edit Event" : "Create Event"}</h2>

            <form onSubmit={handleSubmit}>
              <label>Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <label>Start</label>
              <input
                type="datetime-local"
                name="start"
                value={formData.start}
                onChange={handleChange}
                required
              />
              <label>End</label>
              <input
                type="datetime-local"
                name="end"
                value={formData.end}
                onChange={handleChange}
                required
              />
              <div className="modal-buttons">
                {/* Cancel always */}
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>

                {/* Delete only shows when editing an existing event */}
                {editingEventId && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => {
                      handleDelete(editingEventId);
                      setShowModal(false);
                    }}
                  >
                    Delete
                  </button>
                )}

                {/* Save always */}
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
