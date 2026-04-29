import React, { useState, useEffect } from "react";
import Task from "./Task.jsx";
import "../css/ToDoList.css";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const API = import.meta.env.VITE_API_URL;

const ToDoList = ({ studyPlanId, onProgressChange }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState([]);
  const [showDraft, setShowDraft] = useState(false);
  const [showAssignmentUpload, setShowAssignmentUpload] = useState(false);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const [assignmentUploadError, setAssignmentUploadError] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== "all" && task.priority !== filterPriority)
      return false;
    if (
      filterDueDateFrom &&
      new Date(task.dueDate) < new Date(filterDueDateFrom)
    )
      return false;
    if (filterDueDateTo && new Date(task.dueDate) > new Date(filterDueDateTo))
      return false;
    return true;
  });

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`${API}/tasks?studyPlanId=${studyPlanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setTasks(data);
        else setError(data.message || "Failed to load tasks.");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [studyPlanId]);

  // watches for when any values in tasks changes
  useEffect(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed == true).length;
    const progress = total === 0 ? 100 : (completed / total) * 100;
    if (onProgressChange) onProgressChange(progress);
  }, [tasks]);

  // Disable background while modal is open
  useEffect(() => {
    if (showDraft) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showDraft]);

  const handleAddTask = async ({
    title,
    description,
    priority,
    dueDate,
    recurrence,
  }) => {
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studyPlanID: studyPlanId,
          title,
          description,
          priority,
          dueDate,
          recurrence,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.updatedTask) {
          setTasks((prev) => [...prev, data.updatedTask]);
        }
      } else setError(data.message || "Failed to create task.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t._id === updatedTask._id);
      if (exists) {
        return prev.map((t) => (t._id === updatedTask._id ? updatedTask : t));
      } else {
        return [...prev, updatedTask];
      }
    });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      } else setError("Failed to delete task.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleClearFilters = () => {
    setFilterPriority("all");
    setFilterDueDateFrom("");
    setFilterDueDateTo("");
  };

  const handleGenerateSchedule = async () => {
    if (!token) {
      console.error("No auth token");
      return;
    }

    if (!studyPlanId || generatingSchedule) return;

    setGeneratingSchedule(true);
    setError("");

    try {
      const res = await fetch(`${API}/schedule/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studyPlanId }),
      });

      if (!res.ok) {
        setError("Failed to generate schedule");
        return;
      }

      const data = await res.json();
      console.log("Generated schedule:", data);

      setDraftSchedule(
        data.map((e, idx) => ({
          id: crypto.randomUUID(),
          title: e.title,
          start: new Date(e.start),
          end: new Date(e.end),
          editable: true,
        })),
      );

      setShowDraft(true);
    } catch {
      setError("Failed to generate schedule");
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleUploadAssignment = async () => {
    setAssignmentUploadError("");

    if (!token) {
      setAssignmentUploadError(
        "Please log in to upload an assignment document.",
      );
      return;
    }

    if (!assignmentFile) {
      setAssignmentUploadError("Please select a PDF document.");
      return;
    }

    setUploadingAssignment(true);

    try {
      const formData = new FormData();
      formData.append("file", assignmentFile);
      formData.append("studyPlanId", studyPlanId);

      const res = await fetch(`${API}/tasks/generate-from-document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAssignmentUploadError(
          data.message || "Failed to generate tasks from assignment document.",
        );
        return;
      }

      const createdTasks = Array.isArray(data.tasks) ? data.tasks : [];
      if (createdTasks.length > 0) {
        setTasks((prev) => [...prev, ...createdTasks]);
      }

      setShowAssignmentUpload(false);
      setAssignmentFile(null);
    } catch {
      setAssignmentUploadError("Network error. Please try again.");
    } finally {
      setUploadingAssignment(false);
    }
  };

  const handleConfirmSchedule = async () => {
    try {
      const requests = draftSchedule.map((e) =>
        fetch(`${API}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: e.title,
            start: new Date(e.start).toISOString(),
            end: new Date(e.end).toISOString(),
          }),
        }),
      );

      const results = await Promise.all(requests);

      const failed = results.find((r) => !r.ok);
      if (failed) {
        setError("Some events failed to save");
        return;
      }

      setShowDraft(false);
      setDraftSchedule([]);
    } catch (err) {
      setError("Failed to save schedule");
    }
  };

  const handleDiscardSchedule = () => {
    setDraftSchedule([]);
    setShowDraft(false);
  };

  return (
    <>
      <div className="todolist-card">
        <h2>To-Do List</h2>
        {/* <p>Progress: {progress}% </p> */}
        <div className="filter-bar">
          <select
            aria-label="Filter by priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            type="date"
            aria-label="Filter due date from"
            value={filterDueDateFrom}
            onChange={(e) => setFilterDueDateFrom(e.target.value)}
          />

          <input
            type="date"
            aria-label="Filter due date to"
            value={filterDueDateTo}
            onChange={(e) => setFilterDueDateTo(e.target.value)}
          />

          <button type="button" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet. Add one below!</p>
        ) : (
          <ul aria-label="Task titles summary">
            {filteredTasks.map((task) => (
              <li key={task._id}>
                <span data-testid="task-title-summary">{task.title}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="primary"
          onClick={() => setShowAddTask(true)}
        >
          + Add Task
        </button>
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="upload-assignment-btn"
            onClick={() => setShowAssignmentUpload(true)}
          >
            Upload Assignment PDF
          </button>
          {tasks.length > 0 && (
            <button
              onClick={handleGenerateSchedule}
              disabled={generatingSchedule}
              className="generate-btn"
              type="button"
            >
              {generatingSchedule ? "Generating..." : "Generate Schedule"}
            </button>
          )}
        </div>
        {showAddTask && (
          <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Task</h3>
              </div>

              <AddTaskForm
                onAddTask={(task) => {
                  handleAddTask(task);
                  setShowAddTask(false); // close after submit
                }}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowAddTask(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showDraft && (
          <ScheduleModal
            draftSchedule={draftSchedule}
            setDraftSchedule={setDraftSchedule}
            onConfirm={handleConfirmSchedule}
            onDiscard={handleDiscardSchedule}
          />
        )}
        {showAssignmentUpload && (
          <AssignmentUploadModal
            file={assignmentFile}
            setFile={setAssignmentFile}
            loading={uploadingAssignment}
            error={assignmentUploadError}
            onClose={() => {
              if (!uploadingAssignment) {
                setShowAssignmentUpload(false);
                setAssignmentUploadError("");
              }
            }}
            onSubmit={handleUploadAssignment}
          />
        )}
      </div>
      <div className="tasks-container">
        {filteredTasks.map((task) => (
          <Task
            key={task._id}
            taskObj={task}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>
    </>
  );
};

const AddTaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceValue, setRecurrenceValue] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState("days");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title,
      description,
      priority,
      dueDate,
      recurrence: isRecurring
        ? {
            value: Number(recurrenceValue),
            unit: recurrenceUnit,
          }
        : null,
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setIsRecurring(false);
    setRecurrenceValue(1);
    setRecurrenceUnit("days");
  };

  return (
    <form className="addtask-form" onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>Title</label>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label>Description</label>
        <input
          type="text"
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="modal-field">
        <label>Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          Recurring
        </label>
      </div>

      {isRecurring && (
        <div className="modal-field">
          <input
            type="number"
            min="1"
            value={recurrenceValue}
            onChange={(e) => setRecurrenceValue(e.target.value)}
          />
          <select
            value={recurrenceUnit}
            onChange={(e) => setRecurrenceUnit(e.target.value)}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
      )}

      <div className="modal-actions">
        <button type="submit" className="primary">
          Add Task
        </button>
      </div>
    </form>
  );
};

const ScheduleModal = ({
  draftSchedule,
  setDraftSchedule,
  onConfirm,
  onDiscard,
  onEditEvent,
}) => {
  const [editingEvent, setEditingEvent] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedStart, setEditedStart] = useState("");
  const [editedEnd, setEditedEnd] = useState("");

  const toDatetimeLocal = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;

    setDraftSchedule((prev) =>
      prev.map((ev) =>
        ev.id === editingEvent.id
          ? {
              ...ev,
              title: editedTitle,
              start: new Date(editedStart),
              end: new Date(editedEnd),
            }
          : ev,
      ),
    );

    setEditingEvent(null);
    setEditedTitle("");
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setEditedTitle("");
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Review Draft Schedule</h3>
            <p className="modal-subtext">
              Drag, resize, or click events to edit before saving.
            </p>
          </div>

          <div className="calendar-wrapper">
            <FullCalendar
              height="70vh"
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              editable={true}
              selectable={true}
              events={draftSchedule}
              eventOverlap={false}
              slotDuration="00:15:00"
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              eventDrop={(info) => {
                setDraftSchedule((prev) =>
                  prev.map((ev) =>
                    ev.id === info.event.id
                      ? {
                          ...ev,
                          start: info.event.start,
                          end: info.event.end,
                        }
                      : ev,
                  ),
                );
              }}
              eventResize={(info) => {
                setDraftSchedule((prev) =>
                  prev.map((ev) =>
                    ev.id === info.event.id
                      ? {
                          ...ev,
                          start: info.event.start,
                          end: info.event.end,
                        }
                      : ev,
                  ),
                );
              }}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                setEditingEvent({
                  id: info.event.id,
                });
                setEditedTitle(info.event.title);
                setEditedStart(info.event.start);
                setEditedEnd(info.event.end);
              }}
            />
          </div>

          <div className="modal-actions">
            <button className="secondary" onClick={onDiscard}>
              Discard
            </button>
            <button className="primary" onClick={onConfirm}>
              Confirm Schedule
            </button>
          </div>
        </div>
      </div>

      {editingEvent && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <h2 className="text-lg font-semibold text-gray-800">Edit Event</h2>

            <div className="modal-field">
              <label>Title</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>Start</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(editedStart)}
                onChange={(e) => setEditedStart(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>End</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(editedEnd)}
                onChange={(e) => setEditedEnd(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={handleCancelEdit}>
                Cancel
              </button>

              <button className="primary" onClick={handleSaveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const AssignmentUploadModal = ({
  file,
  setFile,
  loading,
  error,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Assignment PDF</h3>
          <p className="modal-subtext">
            Upload a PDF assignment document and generate tasks for the current
            to-do list.
          </p>
        </div>

        <div className="modal-field">
          <label htmlFor="assignment-upload">Assignment PDF</label>
          <input
            id="assignment-upload"
            type="file"
            accept="application/pdf,.pdf"
            aria-label="Assignment PDF"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p className="modal-subtext">PDF only, up to 20MB.</p>
        </div>

        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        <div className="modal-actions">
          <button
            className="secondary"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="primary"
            onClick={onSubmit}
            disabled={loading || !file}
            type="button"
          >
            {loading ? "Generating..." : "Generate Tasks"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToDoList;
