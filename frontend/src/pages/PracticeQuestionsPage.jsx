import { useEffect, useState } from "react";
import PracticeQuestion from "../components/PracticeQuestion";

const API = import.meta.env.VITE_API_URL;

const PracticeQuestionsPage = ({ studyPlanId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  useEffect(() => {
    async function fetchPracticeQuestions() {
      try {
        const res = await fetch(
          `${API}/practice-questions?studyPlanId=${studyPlanId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (res.ok) setQuestions(data);
        else setError(data.message || "Failed to load practice questions.");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchPracticeQuestions();
  }, [studyPlanId, token]);

  const handleAddPracticeQuestion = async ({ question, answer }) => {
    if (!question.trim() || !answer.trim()) return;
    try {
      const res = await fetch(`${API}/practice-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studyPlanId: studyPlanId, question, answer }),
      });
      const data = await res.json();
      if (res.ok) setQuestions((prev) => [...prev, data]);
      else setError(data.message || "Failed to create practice question.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleUpdatePracticeQuestion = async (id, { question, answer }) => {
    if (!question.trim() || !answer.trim()) return;
    try {
      const res = await fetch(`${API}/practice-questions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studyPlanId: studyPlanId, question, answer }),
      });
      const data = await res.json();
      if (res.ok) setQuestions(questions.map((q) => (q._id === id ? data : q)));
      else setError(data.message || "Failed to update practice question.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleDeletePracticeQuestion = async (id) => {
    try {
      const res = await fetch(`${API}/practice-questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setQuestions(questions.filter((p) => p._id !== id));
      else setError("Failed to delete practice question.");
    } catch {
      setError("Network error. Please try again.");
    }
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
            id={q._id}
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
