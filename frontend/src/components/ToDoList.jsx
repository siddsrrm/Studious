import React, { useState } from "react";
import Task from "./Task.jsx";
import "../css/ToDoList.css";

const ToDoList = ({
  id,
  studyPlanId,
  tasks,
  addTask,
  progress,
  setProgress,
}) => {
  return (
    <>
      <div className="todolist-card">
        <h2>ToDoList</h2>
        <p>To-Do List Id: {id}</p>
        <p>Study Plan Id: {studyPlanId}</p>
        <p>
          Progress: {progress}/{tasks.length}
        </p>
        <p>Tasks:</p>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
        <AddTaskForm onAddTask={addTask} />
      </div>
      <div className="tasks-container">
        {tasks.map((task) => (
          <Task key={task.id} taskObj={task} />
        ))}
      </div>
    </>
  );
};

const AddTaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    onAddTask({ title, description });

    setTitle("");
    setDescription("");
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
      <button type="submit">Add Task</button>
    </form>
  );
};

export default ToDoList;
