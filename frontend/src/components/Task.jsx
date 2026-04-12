import React, { useState } from "react";
import "../css/Task.css";
import Attachments from "./Attachments";

const API = import.meta.env.VITE_API_URL;

const Task = ({ taskObj, onUpdate, onDelete }) => {
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(taskObj.title);
  const [editDescription, setEditDescription] = useState(taskObj.description);
  const [editingSubTaskId, setEditingSubTaskId] = useState(null);
  const [editSubTitle, setEditSubTitle] = useState("");
  const [editSubDescription, setEditSubDescription] = useState("");
  const [editPriority, setEditPriority] = useState(taskObj.priority);

  const handleMarkCompleted = async () => {
    try {
      const incompleteSubTasks = taskObj.subTasks.filter((st) => !st.completed);
      await Promise.all(
        incompleteSubTasks.map((st) =>
          fetch(`${API}/tasks/${taskObj._id}/subtasks/${st._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ completed: true }),
          }),
        ),
      );

      const res = await fetch(`${API}/tasks/${taskObj._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: true }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError("Failed to update task.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`${API}/tasks/${taskObj._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          priority: editPriority,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data);
        setIsEditing(false);
      } else {
        setError("Failed to update task.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleEditCancel = () => {
    setEditTitle(taskObj.title);
    setEditDescription(taskObj.description);
    setIsEditing(false);
    setEditPriority(taskObj.priority);
  };

  const handleAddSubTask = async ({ title, description }) => {
    try {
      const res = await fetch(`${API}/tasks/${taskObj._id}/subtasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError("Failed to create subtask.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleEditSubTaskSave = async (subTaskId) => {
    const res = await fetch(
      `${API}/tasks/${taskObj._id}/subtasks/${subTaskId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editSubTitle,
          description: editSubDescription,
        }),
      },
    );
    const data = await res.json();
    if (res.ok) {
      onUpdate(data);
      setEditingSubTaskId(null);
    } else setError("Failed to update subtask.");
  };

  const handleMarkSubTaskCompleted = async (subTaskId) => {
    try {
      const res = await fetch(
        `${API}/tasks/${taskObj._id}/subtasks/${subTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: true }),
        },
      );
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError("Failed to update subtask.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    try {
      const res = await fetch(
        `${API}/tasks/${taskObj._id}/subtasks/${subTaskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
        {isEditing ? (
          <>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button onClick={handleEditSave}>Save</button>
            <button onClick={handleEditCancel}>Cancel</button>
          </>
        ) : (
          <>
            <h2>{taskObj.title}</h2>
            <p>Description: {taskObj.description}</p>
          </>
        )}
        <p>Priority: {taskObj.priority}</p>
        <p>
          Due:{" "}
          {taskObj.dueDate
            ? new Date(taskObj.dueDate).toLocaleDateString("en-US", {
                timeZone: "UTC",
              })
            : "No due date"}
        </p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button onClick={handleMarkCompleted} disabled={taskObj.completed}>
          {taskObj.completed ? "Completed" : "Mark Complete"}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          disabled={taskObj.completed || isEditing}
        >
          Edit
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
        <p>Attachments:</p>
        <Attachments taskId={taskObj._id} token={token} />
      </div>
      {taskObj.subTasks.map((subTask) => (
        <div className="subtask-card" key={subTask._id}>
          {editingSubTaskId === subTask._id ? (
            <>
              <input
                value={editSubTitle}
                onChange={(e) => setEditSubTitle(e.target.value)}
              />
              <input
                value={editSubDescription}
                onChange={(e) => setEditSubDescription(e.target.value)}
              />
              <button onClick={() => handleEditSubTaskSave(subTask._id)}>
                Save
              </button>
              <button onClick={() => setEditingSubTaskId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <h2>{subTask.title}</h2>
              <p>{subTask.description}</p>
              <button
                onClick={() => {
                  setEditingSubTaskId(subTask._id);
                  setEditSubTitle(subTask.title);
                  setEditSubDescription(subTask.description);
                }}
              >
                Edit
              </button>
            </>
          )}
          <button
            onClick={() => handleMarkSubTaskCompleted(subTask._id)}
            disabled={subTask.completed}
          >
            {subTask.completed ? "Completed" : "Mark Complete"}
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDeleteSubTask(subTask._id)}
          >
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
