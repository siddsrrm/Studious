import React, { useState, useEffect, useRef } from "react";
import { useCalendar } from "../hooks/useCalendar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";

const emptyForm = { title: "", start: "", end: "" };

const Calendar = () => {
  const { events, onCreateEvent, onEditEvent, onDeleteEvent } = useCalendar();
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const calendarRef = useRef(null);

  const pad = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  };

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
  const handleCreateEvent = async () => {
    if (!modal.form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);

    const newEvent = {
      ...modal.form,
      start: new Date(modal.form.start),
      end: new Date(modal.form.end),
    };

    await onCreateEvent(newEvent);
    closeModal();
    setSaving(false);
  };

  // Edit calendar event
  const handleEditEvent = async () => {
    if (!modal.form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);

    const existingEvent = events.find((e) => e._id === modal.eventId);

    if (!existingEvent) {
      setError("Event not found.");
      setSaving(false);
      return;
    }

    const isRecurring = !!existingEvent?.rrule;

    const durationMs = new Date(modal.form.end) - new Date(modal.form.start);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    const updatedEvent = isRecurring
      ? {
          title: modal.form.title,
          rrule: {
            ...existingEvent.rrule,
            dtstart: new Date(modal.form.start),
          },
          duration,
        }
      : {
          title: modal.form.title,
          start: new Date(modal.form.start),
          end: new Date(modal.form.end),
        };

    await onEditEvent(modal.eventId, updatedEvent);
    closeModal();
    setSaving(false);
  };

  // Delete calendar event
  const handleDeleteEvent = async () => {
    setSaving(true);
    await onDeleteEvent(modal.eventId);
    closeModal();
    setSaving(false);
  };

  // Drag event to different day/time
  const handleEventChange = async (changeInfo) => {
    const ev = changeInfo.event;
    const existingEvent = events.find((e) => e._id === ev.id);

    if (!existingEvent) {
      changeInfo.revert();
      return;
    }

    const isRecurring = !!existingEvent?.rrule;

    const durationMs = ev.end ? ev.end - ev.start : 60 * 60 * 1000;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    const updatedFields = isRecurring
      ? {
          rrule: {
            ...existingEvent.rrule,
            dtstart: ev.start,
          },
          duration,
        }
      : {
          start: ev.start,
          end: ev.end ? ev.end : ev.start,
        };

    try {
      await onEditEvent(ev.id, updatedFields);
    } catch {
      changeInfo.revert();
    }
  };

  return (
    <div className="relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          rrulePlugin,
        ]}
        initialView="dayGridMonth"
        timeZone="local"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events
          .filter(
            (e) => !e.rrule || (typeof e.rrule === "object" && e.rrule.freq),
          )
          .map((e) => {
            const isRecurring = !!e.rrule;

            return {
              id: e._id,
              title: e.title,

              ...(isRecurring
                ? {
                    rrule: e.rrule,
                    duration: e.duration,
                  }
                : {
                    start: e.start,
                    end: e.end,
                  }),
            };
          })}
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
                  onClick={handleDeleteEvent}
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
                  onClick={
                    modal.mode === "create"
                      ? handleCreateEvent
                      : handleEditEvent
                  }
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
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
