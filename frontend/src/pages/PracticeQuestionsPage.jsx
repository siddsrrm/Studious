import { useEffect, useState } from "react";
import PracticeQuestion from "../components/PracticeQuestion";

const API = import.meta.env.VITE_API_URL;

const PracticeQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  useEffect(() => {
    async function loadQuestions() {
      const data = await getPracticeQuestions();
      setQuestions(data);
    }

    loadQuestions();
  }, []);

  const handleAddPracticeQuestion = async (newQuestion) => {
    const created = await createPracticeQuestion(newQuestion);

    setQuestions((prev) => [...prev, created]);
  };

  const handleUpdatePracticeQuestion = async (_id, updatedQuestion) => {
    const updated = await updatePracticeQuestion(_id, updatedQuestion);
    s;
    setQuestions(questions.map((q) => (q._id === _id ? updated : q)));
  };

  const handleDeletePracticeQuestion = async (_id) => {
    await deletePracticeQuestion(_id);

    setQuestions(questions.filter((q) => q._id !== _id));
  };

  return (
    <>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          margin: "20px auto",
          width: "85%",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.07)",
          color: "#0f172a",
        }}
      >
        Practice Questions
        <form
          onSubmit={(e) => {
            e.preventDefault();

            handleAddPracticeQuestion({
              studyPlanId: "CURRENT_PLAN_ID",
              question: newQuestion,
              answer: newAnswer,
            });

            setNewQuestion("");
            setNewAnswer("");
          }}
        >
          <input
            placeholder="Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />

          <input
            placeholder="Answer"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
          />

          <button>Add Question</button>
        </form>
      </div>
      <div>
        {questions.map((q) => (
          <PracticeQuestion
            key={q._id}
            studyPlanId={q.studyPlanId}
            question={q.question}
            answer={q.answer}
            onUpdate={handleUpdatePracticeQuestion}
            onDelete={handleDeletePracticeQuestion}
          />
        ))}
      </div>
    </>
  );
};

export default PracticeQuestionsPage;
