import React, { useState } from "react";

const Task = ({ taskObj }) => {
  return (
    <div style={{ border: "2px solid black", padding: "10px", margin: "10px" }}>
      <h2>{taskObj.title}</h2>
      <p>taskID: {taskObj.taskID}</p>
      <p>toDoListID: {taskObj.toDoListID}</p>
      <p>description: {taskObj.description}</p>
      <p>startDate: {taskObj.startDate.toString()}</p>
      <p>endDate: {taskObj.endDate.toString()}</p>
      <p>priorityLevel: {taskObj.priorityLevel}</p>
      <p>completed: {taskObj.completed.toString()}</p>
    </div>
  );
};

export default Task;
