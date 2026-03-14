import { useState } from "react";
import "../css/PracticeQuestion.css";

const PracticeQuestion = ({ studyPlanId, question, answer }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const correct = userAnswer.trim().toLowerCase() === answer.toLowerCase();

    setIsCorrect(correct);
  };

  const statusClass =
    isCorrect === null ? "" : isCorrect ? "correct" : "incorrect";

  return (
    <div className="questionBox">
      <h3>{question}</h3>

      <form onSubmit={handleSubmit} className="answerForm">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className={`answerInput ${statusClass}`}
        />

        <button type="submit" className="checkButton" disabled={isCorrect}>
          Check
        </button>

        {isCorrect !== null && (
          <span className={`resultIcon ${statusClass}`}>
            {isCorrect ? "✔" : "✖"}
          </span>
        )}
      </form>
    </div>
  );
};

export default PracticeQuestion;
