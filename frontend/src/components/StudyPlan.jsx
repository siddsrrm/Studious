import { useState } from "react";
import ToDoList from "./ToDoList";

const StudyPlan = () => {
  const [viewingToDoList, setViewingToDoList] = useState(false);

  const handleViewToDoList = () => {
    setViewingToDoList(true);
  };

  return (
    <>
      <div
        style={{
          border: "2px solid black",
          padding: "10px",
          margin: "10px",
        }}
      >
        <p>StudyPlan</p>
        <p>ID</p>
        <p>Description</p>
        <p>Notes</p>
        <p>To Do List</p>
        <button onClick={() => handleViewToDoList()} disabled={viewingToDoList}>
          To Do List
        </button>
        <p>Practice Questions</p>
      </div>
      <div>{viewingToDoList && <ToDoList />}</div>
    </>
  );
};

export default StudyPlan;
