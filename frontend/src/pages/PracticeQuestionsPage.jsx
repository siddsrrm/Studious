import { useEffect, useState } from "react";
import PracticeQuestion from "../components/PracticeQuestion";
import { getPracticeQuestions } from "../../../backend/models/PracticeQuestion";

const PracticeQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    async function loadQuestions() {
      const data = await getPracticeQuestions();
      setQuestions(data);
    }

    loadQuestions();
  }, []);

  return (
    <div>
      {questions.map((q, index) => (
        <PracticeQuestion
          key={index}
          studyPlanID={q.studyPlanId}
          question={q.question}
          answer={q.answer}
        />
      ))}
    </div>
  );
};

export default PracticeQuestionsPage;
