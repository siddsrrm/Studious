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

    const correct =
      userAnswer.trim().toLowerCase() === answer.trim().toLowerCase();

    setIsCorrect(correct);
  };

  const statusClass =
    isCorrect === null ? "" : isCorrect ? "correct" : "incorrect";

  return (
    <div className="questionBox">
      {editing ? (
        <>
          <h3>Editing</h3>
          <form className="editForm">
            <div className="inputRow">
              <input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
              />

              <input
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
              />
            </div>

            <div className="buttonRow">
              <button
                type="button"
                className="saveButton"
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

              <button
                type="button"
                className="cancelButton"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h3>{question}</h3>
          <form onSubmit={handleSubmit} className="answerForm">
            <div className="inputRow">
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
            </div>

            {isCorrect !== null && (
              <span className={`resultIcon ${statusClass}`}>
                {isCorrect ? "✔" : "✖"}
              </span>
            )}
            <div className="buttonRow">
              <button
                type="button"
                className="editButton"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className="deleteButton"
                onClick={() => onDelete(id)}
              >
                Delete
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default PracticeQuestion;
