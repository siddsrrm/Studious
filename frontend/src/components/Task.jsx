import React, { useState } from "react";

const Task = ({ taskObj }) => {
  const [subTasks, setSubTasks] = useState([]);
  const [completed, setCompleted] = useState(false);

  const handleAddSubTask = ({ title, description }) => {
    let index = subTasks.length + 1;

    let newSubTask = {
      taskID: index,
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

  const handleMarkSubTaskCompleted = (taskID) => {
    setSubTasks(
      subTasks.map((subTask) =>
        subTask.taskID === taskID ? { ...subTask, completed: true } : subTask,
      ),
    );
  };

  return (
    <>
      <div
        style={{ border: "2px solid black", padding: "10px", margin: "10px" }}
      >
        <h2>{taskObj.title}</h2>
        <p>taskID: {taskObj.taskID}</p>
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
            <li key={subTask.taskID}>{subTask.title}</li>
          ))}
        </ul>

        <SubTaskForm onAdd={handleAddSubTask} />
      </div>
      {subTasks.map((subTask) => (
        <div
          key={subTask.taskID}
          style={{
            border: "2px solid black",
            padding: "10px",
            margin: "10px",
          }}
        >
          <h2>{subTask.title}</h2>
          <p>description: {subTask.description}</p>
          <button
            onClick={() => handleMarkSubTaskCompleted(subTask.taskID)}
            disabled={subTask.completed}
          >
            {subTask.completed ? "Completed" : "Mark Complete"}
          </button>{" "}
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
    <form onSubmit={handleSubmit} style={{ marginTop: "5px" }}>
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
