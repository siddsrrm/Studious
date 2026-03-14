import React from "react";

const PracticeQuestion = ({ studyPlanId, question, answer }) => {
  return (
    <div>
      <h3>{question}</h3>
      <p>{answer}</p>
    </div>
  );
};

export default PracticeQuestion;
