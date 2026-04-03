import { useEffect, useState } from "react";
import PracticeQuestion from "../components/PracticeQuestion";
import Flashcard from "../components/Flashcard";
import "../css/PracticeQuestionsPage.css";

const API = import.meta.env.VITE_API_URL;

const PracticeQuestionsPage = ({ studyPlanId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const token = localStorage.getItem("token");
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Generation state
  const [notes, setNotes] = useState([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [questionType, setQuestionType] = useState("free-response");
  const [numQuestions, setNumQuestions] = useState("");

  // Flashcard state
  const [displayAsFlashcards, setDisplayAsFlashcards] = useState(false);

  useEffect(() => {
    setLoading(true);
    async function fetchPracticeQuestions() {
      try {
        const res = await fetch(
          `${API}/practice-questions?studyPlanId=${studyPlanId}`,
          { headers: { Authorization: `Bearer ${token}` } },
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

    async function fetchNotes() {
      try {
        const res = await fetch(`${API}/notes?studyPlanId=${studyPlanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setNotes(data);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      }
    }

    fetchPracticeQuestions();
    fetchNotes();
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
        body: JSON.stringify({ studyPlanId, question, answer }),
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
        body: JSON.stringify({ studyPlanId, question, answer }),
      });
      const data = await res.json();
      if (res.ok)
        setQuestions((prev) => prev.map((q) => (q._id === id ? data : q)));
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
      if (res.ok) setQuestions((prev) => prev.filter((p) => p._id !== id));
      else setError("Failed to delete practice question.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (selectedNoteIds.length === 0) {
      setError("Please select at least one note.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`${API}/practice-questions/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studyPlanId,
          noteIds: selectedNoteIds,
          questionType,
          numQuestions: numQuestions ? parseInt(numQuestions) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions((prev) => [...prev, ...data.questions]);
        setSelectedNoteIds([]);
        setQuestionType("free-response");
        setNumQuestions("");
        setError(`Successfully generated ${data.questions.length} questions!`);
        setTimeout(() => setError(""), 3000);
      } else {
        setError(data.message || "Failed to generate questions.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }; // <-- this closing brace was missing in your branch

  const handleChangeDisplay = (e) => {
    setDisplayAsFlashcards(e.target.checked);
  };

  return (
    <>
      {/* Main card */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Practice Questions</h2>
          {/* Flashcard toggle — only shown when there are questions */}
          {questions.length > 0 && (
            <label className="checkboxItem" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={displayAsFlashcards}
                onChange={handleChangeDisplay}
              />
              <span className="checkboxLabel">Display as flashcards</span>
            </label>
          )}
        </div>

        {error && (
          <p style={{ color: error.startsWith("Successfully") ? "#16a34a" : "red", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading practice questions...</p>
        ) : (
          questions.length === 0 && (
            <p style={{ color: "#64748b" }}>No practice questions yet. Add one below!</p>
          )
        )}

        {/* Manual add form */}
        <form
          className="addQuestionForm"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPracticeQuestion({ question: newQuestion, answer: newAnswer });
            setNewQuestion("");
            setNewAnswer("");
          }}
        >
          <input
            className="addInput"
            placeholder="Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <input
            className="addInput"
            placeholder="Answer"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
          />
          <button type="submit" className="addButton">
            Add Question
          </button>
        </form>

        {/* AI generation section */}
        <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "0.95rem", fontWeight: 600 }}>
            Generate Questions from Notes
          </h3>
          {notes.length === 0 ? (
            <p style={{ color: "#64748b" }}>No notes available. Create some notes first!</p>
          ) : (
            <form onSubmit={handleGenerateQuestions}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Select Notes:
                </label>
                {notes.map((note) => (
                  <div key={note._id} style={{ marginBottom: "8px" }}>
                    <input
                      type="checkbox"
                      id={`note-${note._id}`}
                      checked={selectedNoteIds.includes(note._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNoteIds((prev) => [...prev, note._id]);
                        } else {
                          setSelectedNoteIds((prev) => prev.filter((id) => id !== note._id));
                        }
                      }}
                    />
                    <label htmlFor={`note-${note._id}`} style={{ marginLeft: "8px" }}>
                      {note.title}
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Question Type:
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "100%" }}
                >
                  <option value="free-response">Free Response</option>
                  <option value="multiple-choice">Multiple Choice</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Number of Questions (Optional):
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  placeholder="Leave empty for auto-count based on note length"
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={generating || selectedNoteIds.length === 0}
                style={{
                  padding: "10px 20px",
                  backgroundColor: generating || selectedNoteIds.length === 0 ? "#cbd5e1" : "#4f46e5",
                  color: "white",
                  borderRadius: "6px",
                  border: "none",
                  cursor: generating || selectedNoteIds.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {generating ? "Generating..." : "Generate Questions"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Questions list */}
      <div>
        {questions.map((q) =>
          displayAsFlashcards ? (
            <Flashcard
              key={q._id}
              id={q._id}
              studyPlanId={q.studyPlanId}
              question={q.question}
              answer={q.answer}
              onUpdate={handleUpdatePracticeQuestion}
              onDelete={handleDeletePracticeQuestion}
            />
          ) : (
            <PracticeQuestion
              key={q._id}
              id={q._id}
              studyPlanId={q.studyPlanId}
              question={q.question}
              answer={q.answer}
              questionType={q.questionType}
              options={q.options}
              onUpdate={handleUpdatePracticeQuestion}
              onDelete={handleDeletePracticeQuestion}
            />
          ),
        )}
      </div>
    </>
  );
};

export default PracticeQuestionsPage;