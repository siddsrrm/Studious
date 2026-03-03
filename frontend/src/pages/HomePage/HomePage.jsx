import React, { useState } from "react";
import StudyPlan from "../../components/StudyPlan";
import "../../css/HomePage.css";

const HomePage = () => {
  const studyPlans = [
    { title: "Study Plan 1", id: "SP1", description: "1st Study Plan" },
    { title: "Study Plan 2", id: "SP2", description: "2nd Study Plan" },
    { title: "Study Plan 3", id: "SP3", description: "3rd Study Plan" },
    { title: "Study Plan 4", id: "SP4", description: "4th Study Plan" },
    { title: "Study Plan 5", id: "SP5", description: "5th Study Plan" },
    { title: "Study Plan 6", id: "SP6", description: "6th Study Plan" },
    { title: "Study Plan 7", id: "SP7", description: "7th Study Plan" },
    { title: "Study Plan 8", id: "SP8", description: "8th Study Plan" },
    { title: "Study Plan 9", id: "SP9", description: "9th Study Plan" },
    { title: "Study Plan 10", id: "SP10", description: "10th Study Plan" },
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
