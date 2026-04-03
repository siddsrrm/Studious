import React, { useState, useEffect } from "react";
import { useCalendar } from "../hooks/useCalendar.js";
import { useToDoList } from "../hooks/useToDoList.js";
import { RRule } from "rrule";
import Task from "./Task.jsx";
import "../css/ToDoList.css";

const API = import.meta.env.VITE_API_URL;

const ToDoList = ({ studyPlanId, onProgressChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");
  const [showModal, setShowModal] = useState(null);
  const { events, onCreateEvent, onEditEvent, onDeleteEvent } = useCalendar();
  const { tasks, onCreateTask, onEditTask, onDeleteTask } = useToDoList();

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

  // watches for when any values in tasks changes
  useEffect(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed == true).length;
    const progress = total === 0 ? 100 : (completed / total) * 100;
    if (onProgressChange) onProgressChange(progress);
  }, [tasks]);

  const handleAddTask = async (form) => {
    try {
      const newTask = await onCreateTask(form);

      const startDate = new Date(form.dueDate + "T00:00");
      const endDate = new Date(form.dueDate + "T01:00"); // default 1-hour duration

      let eventObj = {
        title: form.title,
        start: startDate,
        end: endDate,
      };

      if (form.recurrence?.enabled) {
        eventObj.rrule = {
          freq: form.recurrence.freq.toUpperCase(), // IMPORTANT
          interval: form.recurrence.interval || 1,
          dtstart: startDate.toISOString(),
          until: new Date(
            startDate.getTime() + 90 * 24 * 60 * 60 * 1000, // recurs up to 90 days instead of forever
          ).toISOString(),
        };

        eventObj.duration = "01:00"; // 1 hour (FullCalendar format)
      }

      await onCreateEvent(eventObj);
    } catch (err) {
      console.error("Error adding task/event:", err);
      setError("Failed to create event.");
    }
  };

  const handleUpdateTask = (taskId, form) => {
    onEditTask(taskId, form);
  };

  const handleDeleteTask = async (taskId) => {
    onDeleteTask(taskId);
  };

  const handleClearFilters = () => {
    setFilterPriority("all");
    setFilterDueDateFrom("");
    setFilterDueDateTo("");
  };

  return (
    <>
      <div className="todolist-card">
        <h2>To-Do List</h2>
        {/* <p>Progress: {progress}% </p> */}
        <div className="filter-bar">
          <select
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
            value={filterDueDateFrom}
            onChange={(e) => setFilterDueDateFrom(e.target.value)}
          />
          <input
            type="date"
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
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✖
              </button>
              <AddTaskForm
                onAddTask={(taskData) => {
                  handleAddTask(taskData);
                  setShowModal(false); // close after submit
                }}
              />
            </div>
          </div>
        )}
        <button
          className="addButton"
          type="button"
          onClick={() => setShowModal(true)}
        >
          Add Task
        </button>
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
  const [recurrence, setRecurrence] = useState({
    enabled: false,
    freq: "weekly",
    interval: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({ title, description, priority, dueDate, recurrence });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setRecurrence({
      enabled: false,
      freq: "weekly",
      interval: 1,
    });
  };

  return (
    <form className="addtask-form" onSubmit={handleSubmit}>
      <h3>Create New Task</h3>
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
      <label className="checkboxItem">
        <span className="checkboxLabel">Recurring</span>
        <input
          type="checkbox"
          checked={recurrence.enabled}
          onChange={() => {
            setRecurrence((prev) => ({ ...prev, enabled: !prev.enabled }));
          }}
        />
      </label>
      {recurrence.enabled && (
        <>
          <select
            value={recurrence.freq}
            onChange={(e) =>
              setRecurrence((prev) => ({
                ...prev,
                freq: e.target.value,
              }))
            }
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <input
            type="number"
            min="1"
            value={recurrence.interval}
            onChange={(e) =>
              setRecurrence((prev) => ({
                ...prev,
                interval: Number(e.target.value),
              }))
            }
          />
        </>
      )}
      <button type="submit">Add Task</button>
    </form>
  );
};

export default ToDoList;
