import React, { useState } from "react";
import "../css/Task.css";

const Task = ({ taskObj }) => {
  const [subTasks, setSubTasks] = useState([]);
  const [completed, setCompleted] = useState(false);

  const handleAddSubTask = ({ title, description }) => {
    let index = subTasks.length + 1;

    let newSubTask = {
      id: index,
      toDoListID: 123,
      title: title,
      description: description,
      startDate: new Date(),
      endDate: new Date(),
      priorityLevel: "low",
      completed: false,
    };

    setSubTasks([...subTasks, newSubTask]);
    setCompleted(false);
  };

  const handleMarkCompleted = () => {
    setCompleted(true);
    setSubTasks(subTasks.map((subTask) => ({ ...subTask, completed: true })));
  };

  const handleMarkSubTaskCompleted = (id) => {
    setSubTasks(
      subTasks.map((subTask) =>
        subTask.id === id ? { ...subTask, completed: true } : subTask,
      ),
    );
  };

  return (
    <>
      <div className="task-card">
        <h2>{taskObj.title}</h2>
        <p>id: {taskObj.id}</p>
        <p>toDoListID: {taskObj.toDoListID}</p>
        <p>description: {taskObj.description}</p>
        <p>startDate: {taskObj.startDate.toString()}</p>
        <p>endDate: {taskObj.endDate.toString()}</p>
        <p>priorityLevel: {taskObj.priorityLevel}</p>
        <button onClick={handleMarkCompleted} disabled={completed}>
          {completed ? "Completed" : "Mark Complete"}
        </button>
        <p>subTasks:</p>
        <ul>
          {subTasks.map((subTask) => (
            <li key={subTask.id}>{subTask.title}</li>
          ))}
        </ul>
        <SubTaskForm onAdd={handleAddSubTask} />
      </div>
      {subTasks.map((subTask) => (
        <div className="subtask-card" key={subTask.id}>
          <h2>{subTask.title}</h2>
          <p>description: {subTask.description}</p>
          <button
            onClick={() => handleMarkSubTaskCompleted(subTask.id)}
            disabled={subTask.completed}
          >
            {subTask.completed ? "Completed" : "Mark Complete"}
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
    if (!title) return;

    onAdd({ title, description });

    setTitle("");
    setDescription("");
  };

  return (
    <form className="subtask-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="SubTask title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="SubTask description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">Add SubTask</button>
    </form>
  );
};

export default Task;
