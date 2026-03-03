import { useState } from "react";
import ToDoList from "./ToDoList";
import "../css/StudyPlan.css";

const StudyPlan = ({ studyPlanObj }) => {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(0);
  const [viewingToDoList, setViewingToDoList] = useState(false);

  const handleViewToDoList = () => {
    setViewingToDoList(true);
  };

  const handleAddTask = ({ title, description }) => {
    let index = tasks.length + 1;

    let newTask = {
      id: index,
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
      <div className="studyplan-card">
        <h3>{studyPlanObj.title}</h3>
        <p>ID: {studyPlanObj.id}</p>
        <p>Description: {studyPlanObj.description}</p>
        <p>Notes</p>
        <p>To Do List</p>
        <button onClick={handleViewToDoList} disabled={viewingToDoList}>
          To Do List
        </button>
        <p>Practice Questions</p>
      </div>
      <div>
        {viewingToDoList && (
          <ToDoList
            id="123"
            studyPlanId={studyPlanObj.id}
            tasks={tasks}
            addTask={handleAddTask}
            progress={progress}
            setProgress={setProgress}
          />
        )}
      </div>
    </>
  );
};

export default StudyPlan;
