import React, { useState, useEffect } from "react";
import Task from "./Task.jsx";
import "../css/ToDoList.css";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const API = import.meta.env.VITE_API_URL;

const ToDoList = ({ studyPlanId, onProgressChange }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState([]);
  const [showDraft, setShowDraft] = useState(false);

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

  const handleAddTask = async ({ title, description, priority, dueDate }) => {
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
        }),
      });
      const data = await res.json();
      if (res.ok) setTasks([...tasks, data]);
      else setError(data.message || "Failed to create task.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTasks(tasks.filter((t) => t._id !== taskId));
      else setError("Failed to delete task.");
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

  const handleConfirmSchedule = async () => {
    const res = await fetch(`${API}/events/bulk-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        events: draftSchedule.map((e) => ({
          title: e.title,
          start: new Date(e.start).toISOString(),
          end: new Date(e.end).toISOString(),
        })),
      }),
    });

    if (!res.ok) {
      setError("Failed to save schedule");
      return;
    }

    setShowDraft(false);
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
          <ul>
            {filteredTasks.map((task) => (
              <li key={task._id}>{task.title}</li>
            ))}
          </ul>
        )}
        <AddTaskForm onAddTask={handleAddTask} />
        {tasks.length > 0 && (
          <button
            onClick={handleGenerateSchedule}
            disabled={generatingSchedule}
            className="generate-btn"
          >
            {generatingSchedule ? "Generating..." : "Generate Schedule"}
          </button>
        )}
        {showDraft && (
          <>
            <div style={{ marginTop: "20px" }}>
              <h3>Review Draft Schedule</h3>

              <FullCalendar
                height="70vh"
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                editable={true}
                selectable={true}
                events={draftSchedule}
                eventOverlap={false}
                slotDuration="00:15:00"
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
                  const newTitle = prompt("Edit title:", info.event.title);

                  if (!newTitle) return;

                  setDraftSchedule((prev) =>
                    prev.map((ev) =>
                      ev.id === info.event.id ? { ...ev, title: newTitle } : ev,
                    ),
                  );
                }}
              />
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <button onClick={handleConfirmSchedule}>Confirm Schedule</button>

              <button onClick={handleDiscardSchedule}>Discard</button>
            </div>
          </>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({ title, description, priority, dueDate });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
  };

  return (
    <form className="addtask-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Task description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button type="submit">Add Task</button>
    </form>
  );
};

export default ToDoList;
