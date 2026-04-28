import React, { useState } from "react";
import "../css/Task.css";
import Attachments from "./Attachments";
import AITaskBreakdown from "./AITaskBreakdown";

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
  const [isRecurring, setIsRecurring] = useState(!!taskObj.recurrence);
  const [recurrenceValue, setRecurrenceValue] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState("days");

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
      if (res.ok) {
        if (data.updatedTask) onUpdate(data.updatedTask);
        if (data.newTask) onUpdate(data.newTask); // Adds task copy 'newTask' if recurring
      } else setError("Failed to update task.");
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
          recurrence: isRecurring
            ? {
                value: Number(recurrenceValue),
                unit: recurrenceUnit,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.updatedTask) onUpdate(data.updatedTask);
        if (data.newTask) onUpdate(data.newTask);
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
      if (res.ok) {
        if (data.updatedTask) onUpdate(data.updatedTask);
        if (data.newTask) onUpdate(data.newTask);
      } else setError("Failed to create subtask.");
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
      if (data.updatedTask) onUpdate(data.updatedTask);
      if (data.newTask) onUpdate(data.newTask);
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
      if (res.ok) {
        if (data.updatedTask) onUpdate(data.updatedTask);
        if (data.newTask) onUpdate(data.newTask);
      } else setError("Failed to update subtask.");
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
      if (res.ok) {
        if (data.updatedTask) onUpdate(data.updatedTask);
        if (data.newTask) onUpdate(data.newTask);
      } else setError("Failed to delete subtask.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const toMilliseconds = (value, unit) => {
    const num = parseInt(value || 0, 10);

    switch (unit) {
      case "minutes":
        return num * 60 * 1000;
      case "hours":
        return num * 60 * 60 * 1000;
      case "days":
        return num * 24 * 60 * 60 * 1000;
      case "weeks":
        return num * 7 * 24 * 60 * 60 * 1000;
      case "months":
        return num * 30 * 24 * 60 * 60 * 1000; // approximation
      default:
        return null;
    }
  };

  const startEditing = () => {
    setEditTitle(taskObj.title || "");
    setEditDescription(taskObj.description || "");
    setEditPriority(taskObj.priority || "medium");
    setIsRecurring(!!taskObj.recurrence);

    if (taskObj.recurrence) {
      setRecurrenceValue(taskObj.recurrence.value || 1);
      setRecurrenceUnit(taskObj.recurrence.unit || "days");
    } else {
      setRecurrenceValue(1);
      setRecurrenceUnit("days");
    }

    setIsEditing(true);
  };

  return (
    <>
      <div className="task-card">
        <>
          <h2>{taskObj.title}</h2>
          <p>Description: {taskObj.description}</p>
        </>
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
        <p>Subtasks:</p>
        <ul>
          {taskObj.subTasks.map((subTask) => (
            <li key={subTask._id}>{subTask.title}</li>
          ))}
        </ul>
        <AITaskBreakdown taskObj={taskObj} onAdd={handleAddSubTask} />
        <SubTaskForm onAdd={handleAddSubTask} />
        <p>Attachments:</p>
        <Attachments taskId={taskObj._id} token={token} />
        {isEditing && (
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
            <label>
              <input
                type="checkbox"
                checked={isRecurring || false}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Recurring
            </label>
            {isRecurring && (
              <div className="recurrence-row">
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
            <button onClick={handleEditSave}>Save</button>
            <button onClick={handleEditCancel}>Cancel</button>
          </>
        )}
        <button
          onClick={startEditing}
          disabled={taskObj.completed || isEditing}
        >
          Edit
        </button>
        <button className="delete-btn" onClick={() => onDelete(taskObj._id)}>
          Delete Task
        </button>
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
