import React, { useState } from "react";
import StudyPlan from "../../components/StudyPlan";

const HomePage = () => {
  const studyPlans = [
    { title: "Study Plan 1" },
    { title: "Study Plan 2" },
    { title: "Study Plan 3" },
    { title: "Study Plan 4" },
    { title: "Study Plan 5" },
  ];

  const [viewingStudyPlan, setViewingStudyPlan] = useState(() =>
    studyPlans.map(() => false),
  );

  const handleClick = (index) => {
    const updated = studyPlans.map(() => false);
    updated[index] = true;
    setViewingStudyPlan(updated);
  };

  return (
    <div>
      <h1>Studious Home Page</h1>
      {studyPlans.length === 0 && (
        <p>You have not yet created any study plans...</p>
      )}
      {studyPlans.map((studyPlan, index) => (
        <div>
          <button
            onClick={() => handleClick(index)}
            disabled={viewingStudyPlan[index]}
          >
            {"View " + studyPlan.title}
          </button>
        </div>
      ))}
      {studyPlans.map((studyPlan, index) => (
        <div>
          {viewingStudyPlan[index] && <StudyPlan studyPlanObj={studyPlan} />}
        </div>
      ))}
    </div>
  );
};

export default HomePage;
