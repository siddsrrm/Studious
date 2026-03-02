import React, { useState } from "react";
import StudyPlan from "../../components/StudyPlan";
import "../../css/HomePage.css";

const HomePage = () => {
  const studyPlans = [
    { title: "Study Plan 1" },
    { title: "Study Plan 2" },
    { title: "Study Plan 3" },
    { title: "Study Plan 4" },
    { title: "Study Plan 5" },
    { title: "Study Plan 6" },
    { title: "Study Plan 7" },
    { title: "Study Plan 8" },
    { title: "Study Plan 9" },
    { title: "Study Plan 10" },
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
    <div className="home-container">
      <h1 className="home-title">Studious Home Page</h1>
      {studyPlans.length === 0 ? (
        <p className="no-studyplans">You don’t have any study plans yet.</p>
      ) : (
        <div className="studyplan-dropdown-container">
          <select
            value={viewingStudyPlan.findIndex((v) => v)}
            onChange={(e) => handleClick(parseInt(e.target.value))}
          >
            <option value={-1} disabled>
              Select a Study Plan
            </option>
            {studyPlans.map((plan, index) => (
              <option key={index} value={index}>
                {plan.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {studyPlans.map((studyPlan, index) => (
        <div>
          {viewingStudyPlan[index] && <StudyPlan studyPlanObj={studyPlan} />}
        </div>
      ))}
    </div>
  );
};

export default HomePage;
