import React, { useState, useEffect } from "react";
import Task from "./Task.jsx";
import "../css/ToDoList.css";

const API = import.meta.env.VITE_API_URL;

const ToDoList = ({ studyPlanId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

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

  const handleAddTask = async ({ title, description, priority, dueDate }) => {
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studyPlanID: studyPlanId, title, description, priority, dueDate }),
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

  const progress = 0; //placeholder for progress tracker later

  return (
    <>
      <div className="todolist-card">
        <h2>To-Do List</h2>
        <p>Progress: {progress}% </p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet. Add one below!</p>
        ) : (
          <ul>
            {tasks.map((task) => (
              <li key={task._id}>{task.title}</li>
            ))}
          </ul>
        )}
        <AddTaskForm onAddTask={handleAddTask} />
      </div>
      <div className="tasks-container">
        {tasks.map((task) => (
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