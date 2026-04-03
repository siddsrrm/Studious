import React, { useState, useEffect } from "react";
import "../css/PracticeQuestion.css";
import "../css/Flashcard.css";

const Flashcard = ({
  id,
  studyPlanId,
  question,
  answer,
  onUpdate,
  onDelete,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(question);
  const [editAnswer, setEditAnswer] = useState(answer);

  useEffect(() => {
    setEditQuestion(question);
    setEditAnswer(answer);
  }, [question, answer]);

  const handleFlip = () => {
    if (!editing) setIsFlipped(!isFlipped);
  };

  return (
    <div className="flashcard-wrapper">
      <div
        className="flashcard-container"
        onClick={handleFlip}
        data-id={id}
        data-study-plan-id={studyPlanId}
      >
        <div className={`flashcard ${isFlipped ? "flipped" : ""}`}>
          <div className="flashcard-front">
            <span className="flashcard-label">Question</span>
            <p className="flashcard-text">{question}</p>
          </div>
          <div className="flashcard-back">
            <span className="flashcard-label">Answer</span>
            <p className="flashcard-text">{answer}</p>
          </div>
        </div>
      </div>

      {/* Buttons / Edit Form below the card */}
      <div className="flashcard-bottom">
        {editing ? (
          <form className="editForm">
            <div className="inputRow">
              <input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <input
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="buttonRow">
              <button
                type="button"
                className="saveButton"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(id, { question: editQuestion, answer: editAnswer });
                  setEditing(false);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="cancelButton"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="buttonRow">
            <button
              type="button"
              className="editButton"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="deleteButton"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcard;
