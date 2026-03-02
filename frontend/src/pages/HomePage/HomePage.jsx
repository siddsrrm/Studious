import React, { useState } from "react";
import Calendar from "../../components/Calendar";
import ToDoList from "../../components/ToDoList";
import StudyPlan from "../../components/StudyPlan";

const HomePage = () => {
  const [disabled, setDisabled] = useState(false);
  const handleClick = () => {
    setDisabled(true);
  };

  return (
    <div>
      <h1>Studious Home Page</h1>
      <button onClick={() => handleClick()} disabled={disabled}>
        View Study Plan
      </button>
      {disabled && <StudyPlan />}
    </div>
  );
};

export default HomePage;
