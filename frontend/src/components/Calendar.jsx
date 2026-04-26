import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const API = import.meta.env.VITE_API_URL;

const emptyForm = { title: "", start: "", end: "" };

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const calendarRef = useRef(null);
  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/events`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error loading events:", err));
  }, []);

  const openCreate = (dateStr) => {
    setError("");
    setModal({
      mode: "create",
      form: { title: "", start: dateStr + "T09:00", end: dateStr + "T10:00" },
    });
  };

  const openEdit = (clickInfo) => {
    setError("");
    const ev = clickInfo.event;
    const pad = (d) => d.toISOString().slice(0, 16);
    setModal({
      mode: "edit",
      eventId: ev.id,
      form: {
        title: ev.title,
        start: ev.start ? pad(ev.start) : "",
        end: ev.end ? pad(ev.end) : pad(ev.start),
      },
    });
  };

  const closeModal = () => setModal(null);

  const handleFormChange = (e) =>
    setModal((prev) => ({
      ...prev,
      form: { ...prev.form, [e.target.name]: e.target.value },
    }));

  // Create calendar event
  const handleCreate = async () => {
    if (!modal.form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(modal.form),
      });
      const saved = await res.json();
      setEvents((prev) => [...prev, saved]);
      closeModal();
    } catch (err) {
      console.log(err);
      setError("Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  // Edit calendar event
  const handleEdit = async () => {
    if (!modal.form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/events/${modal.eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(modal.form),
      });
      const updated = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e)),
      );
      closeModal();
    } catch (err) {
      console.log(err);
      setError("Failed to update event.");
    } finally {
      setSaving(false);
    }
  };

  // Delete calendar event
  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/events/${modal.eventId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setEvents((prev) => prev.filter((e) => e._id !== modal.eventId));
      closeModal();
    } catch (err) {
      console.log(err);
      setError("Failed to delete event.");
    } finally {
      setSaving(false);
    }
  };

  // Drag event to different day/time
  const handleEventChange = async (changeInfo) => {
    const ev = changeInfo.event;
    const pad = (d) => d.toISOString().slice(0, 16);
    const body = {
      start: pad(ev.start),
      end: ev.end ? pad(ev.end) : pad(ev.start),
    };
    try {
      const res = await fetch(`${API}/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e)),
      );
    } catch (err) {
      changeInfo.revert();
    }
  };

  return (
    <div className="relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events.map((e) => ({ ...e, id: e._id }))}
        dateClick={(info) => openCreate(info.dateStr)}
        eventClick={openEdit}
        editable={true}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
      />

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800">
              {modal.mode === "create" ? "New Event" : "Edit Event"}
            </h2>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={modal.form.title}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Event title"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Start
              </label>
              <input
                type="datetime-local"
                name="start"
                value={modal.form.start}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                End
              </label>
              <input
                type="datetime-local"
                name="end"
                value={modal.form.end}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {modal.mode === "edit" ? (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={modal.mode === "create" ? handleCreate : handleEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : modal.mode === "create"
                      ? "Create"
                      : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
