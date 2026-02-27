import React, { useState } from "react";
import Task from "./Task.jsx";

const ToDoList = ({ toDoListId, studyPlanId }) => {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(0);

  const handleAddTask = ({ title, description }) => {
    let index = tasks.length + 1;

    let newTask = {
      taskID: index,
      toDoListID: 123,
      title: title,
      description: description,
      startDate: new Date(),
      endDate: new Date(),
      priorityLevel: "low",
    };

    setTasks([...tasks, newTask]);
  };

  return (
    <>
      <div
        style={{ border: "2px solid black", padding: "10px", margin: "10px" }}
      >
        <h2>ToDoList</h2>
        <p>To-Do List Id: {toDoListId}</p>
        <p>Study Plan Id: {studyPlanId}</p>
        <p>Progress: {progress}</p>
        <p>Tasks:</p>
        <ul>
          {tasks.map((task) => (
            <li key={task.taskID}>{task.title}</li>
          ))}
        </ul>
        <AddTaskForm onAddTask={handleAddTask} />
      </div>
      <div>
        {tasks.map((task) => (
          <Task key={task.taskID} taskObj={task} />
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
    <form onSubmit={handleSubmit} style={{ marginTop: "10px" }}>
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
