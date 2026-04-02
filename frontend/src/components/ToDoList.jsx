import React, { useState, useEffect } from "react";
import Task from "./Task.jsx";
import "../css/ToDoList.css";

const API = import.meta.env.VITE_API_URL;

const ToDoList = ({ studyPlanId, onProgressChange }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");
  const [showModal, setShowModal] = useState(null);

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
  const [recurring, setRecurring] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({ title, description, priority, dueDate });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setRecurring(false);
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
          checked={recurring}
          onChange={() => {
            setRecurring(!recurring);
          }}
        />
      </label>
      <button type="submit">Add Task</button>
    </form>
  );
};

export default ToDoList;
