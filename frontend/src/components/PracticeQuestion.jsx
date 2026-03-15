import { useState } from "react";
import "../css/PracticeQuestion.css";

const PracticeQuestion = ({
  id,
  studyPlanId,
  question,
  answer,
  onUpdate,
  onDelete,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(question);
  const [editAnswer, setEditAnswer] = useState(answer);

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
          disabled={isCorrect === true}
          onChange={(e) => setUserAnswer(e.target.value)}
          className={`answerInput ${statusClass}`}
        />

        <button
          type="submit"
          className="checkButton"
          disabled={isCorrect === true}
        >
          Check
        </button>

        {isCorrect !== null && (
          <span className={`resultIcon ${statusClass}`}>
            {isCorrect ? "✔" : "✖"}
          </span>
        )}

        {editing ? (
          <>
            <input
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
            />

            <input
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
            />

            <button
              type="button"
              onClick={() => {
                onUpdate(id, {
                  question: editQuestion,
                  answer: editAnswer,
                });
                setIsCorrect(null);
                setEditing(false);
              }}
            >
              Save
            </button>

            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)}>Edit</button>
            <button onClick={() => onDelete(id)}>Delete</button>
          </>
        )}
      </form>
    </div>
  );
};

export default PracticeQuestion;
