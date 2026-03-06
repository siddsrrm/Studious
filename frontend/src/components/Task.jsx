import React, { useState } from "react";
import "../css/Task.css";

const API = import.meta.env.VITE_API_URL;

const Task = ({ taskObj, onUpdate, onDelete }) => {
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const handleMarkCompleted = async () => {
    try {
      const res = await fetch(`${API}/tasks/${taskObj._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: true }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError("Failed to update task.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleAddSubTask = async ({ title, description }) => {
    try {
      const res = await fetch(`${API}/tasks/${taskObj._id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError("Failed to create subtask.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleMarkSubTaskCompleted = async (subTaskId) => {
    try {
      const res = await fetch(`${API}/tasks/${taskObj._id}/subtasks/${subTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Failed to update subtask."); return; }

      //check if all subtasks are now complete
      const allComplete = data.subTasks.every((st) => st.completed);
      if (allComplete && data.subTasks.length > 0) {
        const taskRes = await fetch(`${API}/tasks/${taskObj._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ completed: true }),
        });
        const taskData = await taskRes.json();
        if (taskRes.ok) { onUpdate(taskData); return; }
      }

      onUpdate(data);
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    try {
      const res = await fetch(`${API}/tasks/${taskObj._id}/subtasks/${subTaskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError("Failed to delete subtask.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <>
      <div className="task-card">
        <h2>{taskObj.title}</h2>
        <p>Description: {taskObj.description}</p>
        <p>Priority: {taskObj.priorityLevel}</p>
        <p>Due: {taskObj.dueDate ? new Date(taskObj.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : "No due date"}</p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button onClick={handleMarkCompleted} disabled={taskObj.completed}>
          {taskObj.completed ? "Completed" : "Mark Complete"}
        </button>
        <button className="delete-btn" onClick={() => onDelete(taskObj._id)}>
          Delete Task
        </button>
        <p>Subtasks:</p>
        <ul>
          {taskObj.subTasks.map((subTask) => (
            <li key={subTask._id}>{subTask.title}</li>
          ))}
        </ul>
        <SubTaskForm onAdd={handleAddSubTask} />
      </div>
      {taskObj.subTasks.map((subTask) => (
        <div className="subtask-card" key={subTask._id}>
          <h2>{subTask.title}</h2>
          <p>{subTask.description}</p>
          <button
            onClick={() => handleMarkSubTaskCompleted(subTask._id)}
            disabled={subTask.completed}
          >
            {subTask.completed ? "Completed" : "Mark Complete"}
          </button>
          <button className="delete-btn" onClick={() => handleDeleteSubTask(subTask._id)}>
            Delete
          </button>
        </div>
      ))}
    </>
  );
};

const SubTaskForm = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, description });
    setTitle("");
    setDescription("");
  };

  return (
    <form className="subtask-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Subtask title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subtask description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">Add Subtask</button>
    </form>
  );
};

export default Task;