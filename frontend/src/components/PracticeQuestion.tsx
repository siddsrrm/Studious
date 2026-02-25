/*import { useState } from "react";
import "../css/PracticeQuestion.css";

interface Props {
  questionID: string;
  question: string;
  answer: string;
  studyPlanID: string;
}

const PracticeQuestion = ({
  questionID,
  question,
  answer,
  studyPlanID,
}: Props) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flashcard-container" onClick={handleFlip}>
      <div className={`flashcard ${isFlipped ? "flipped" : ""}`}>
        <div className="flashcard-face flashcard-front">{question}</div>
        <div className="flashcard-face flashcard-back">{answer}</div>
      </div>
    </div>
  );
};

export default PracticeQuestion;
*/
