import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL;

const AITaskBreakdown = ({ taskObj, onAdd }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const token = localStorage.getItem("token");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/upload/generate-task-breakdown`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: taskObj.title, description: taskObj.description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "AI request failed");
      } else {
        setSuggestions(data.subtasks || []);
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (s) => {
    try {
      await onAdd({ title: s.title, description: s.description || "" });
      setSuggestions((prev) => prev.filter((item) => item !== s));
    } catch (e) {
      setError("Failed to add subtask");
    }
  };

  return (
    <div className="ai-task-breakdown" style={{ marginTop: 8 }}>
      <button onClick={generate} disabled={loading}>
        {loading ? "Generating..." : "Suggest Subtasks (AI)"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {suggestions && suggestions.length > 0 && (
        <ul>
          {suggestions.map((s, i) => (
            <li key={i} style={{ marginTop: 6 }}>
              <div>
                <strong>{s.title}</strong>
              </div>
              {s.description && <div style={{ fontSize: 13 }}>{s.description}</div>}
              <button onClick={() => handleAdd(s)} style={{ marginTop: 4 }}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AITaskBreakdown;
