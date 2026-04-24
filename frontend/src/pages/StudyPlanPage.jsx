import React, { useState, useEffect } from "react";
import ToDoList from "../components/ToDoList";
import NoteEditor from "../components/NoteEditor";
import NotePage from "./NotePage";
import PracticeQuestionsPage from "./PracticeQuestionsPage";
import WorkloadPage from "./CourseInfoPage";
import GradeBookPage from "./GradeBookPage";

function MilestonesModal({
  studyPlanId,
  milestones,
  setMilestones,
  setStudyPlans,
  setMilestoneVersion,
  onClose,
}) {
  const [title, setTitle] = useState("");
  const [targetPercent, setTargetPercent] = useState(50);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  function syncToParent(updatedMilestones) {
    setStudyPlans((prev) =>
      prev.map((p) =>
        p.id === studyPlanId ? { ...p, milestones: updatedMilestones } : p,
      ),
    );
  }

  function handleEdit(ms) {
    setEditingId(ms._id);
    setTitle(ms.title);
    setTargetPercent(ms.targetPercent);
    setError("");
  }

  function handleCancel() {
    setEditingId(null);
    setTitle("");
    setTargetPercent(50);
    setError("");
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    if (targetPercent < 1 || targetPercent > 100) {
      setError("Percentage must be between 1 and 100.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (editingId) {
        // Edit existing
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/study-plans/${studyPlanId}/milestones/${editingId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, targetPercent }),
          },
        );
        const data = await res.json();
        if (res.ok) {
          const updated = milestones.map((m) =>
            m._id === editingId ? data.milestone : m,
          );
          setMilestones(updated);
          syncToParent(updated);
          setMilestoneVersion((v) => v + 1);

          handleCancel();
        } else {
          setError(data.message || "Failed to update milestone.");
        }
      } else {
        // Create new
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/study-plans/${studyPlanId}/milestones`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, targetPercent }),
          },
        );
        const data = await res.json();
        if (res.ok) {
          const updated = [...milestones, data.milestone];
          setMilestones(updated);
          syncToParent(updated);
          handleCancel();
        } else {
          setError(data.message || "Failed to create milestone.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/study-plans/${studyPlanId}/milestones/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const updated = milestones.filter((m) => m._id !== id);
        setMilestones(updated);
        syncToParent(updated);
        if (editingId === id) handleCancel();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
              margin: 0,
            }}
          >
            Manage Milestones
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* Existing milestones list */}
        {milestones.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#9ca3af",
              marginBottom: "16px",
            }}
          >
            No milestones yet. Add one below.
          </p>
        ) : (
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {[...milestones]
              .sort((a, b) => a.targetPercent - b.targetPercent)
              .map((ms) => (
                <div
                  key={ms._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: ms.completed ? "#4f46e5" : "#fff",
                        border: "2px solid #4f46e5",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                      {ms.title}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      at {ms.targetPercent}%
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(ms)}
                      style={{
                        fontSize: "0.75rem",
                        color: "#4f46e5",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ms._id)}
                      style={{
                        fontSize: "0.75rem",
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        <hr style={{ borderColor: "#e5e7eb", marginBottom: "16px" }} />

        {/* Add / Edit form */}
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#6b7280",
            marginBottom: "8px",
          }}
        >
          {editingId ? "Edit milestone" : "Add milestone"}
        </p>
        <input
          type="text"
          placeholder="Milestone title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setError("")}
          style={{
            color: "#111827",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid #000000",
            fontSize: "0.875rem",
            marginBottom: "10px",
            boxSizing: "border-box",
            backgroundColor: "#fff",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <input
            type="range"
            min={1}
            max={100}
            value={targetPercent}
            onChange={(e) => setTargetPercent(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span
            style={{ fontSize: "0.875rem", color: "#374151", minWidth: "36px" }}
          >
            {targetPercent}%
          </span>
        </div>

        {error && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#ef4444",
              marginBottom: "10px",
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          {editingId && (
            <button
              onClick={handleCancel}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#fff",
                fontSize: "0.875rem",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Add Milestone"}
          </button>
        </div>
      </div>
    </div>
  );
}

const StudyPlanPage = ({ plan, onBack, setStudyPlans }) => {
  const safePlan = plan ?? { milestones: [] };
  const planId = safePlan.id || safePlan._id;

  const [activeTab, setActiveTab] = useState("To-Do List");
  const [progress, setProgress] = useState(0);
  const [milestones, setMilestones] = useState(safePlan.milestones);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneVersion, setMilestoneVersion] = useState(0);

  const allTabs = [
    "To-Do List",
    "Notes",
    "Grade Book",
    "Practice Questions",
    "Course Info",
  ];

  
  useEffect(() => {
  const startTime = Date.now();
  console.log(`Started studying plan at ${new Date(startTime).toISOString()}`);

  return () => {
    const durationMins = Math.round((Date.now() - startTime) / 1000 / 60);
    console.log(`logging duration as ${durationMins}`);
    if (durationMins < 1) return; // ignore accidental clicks

    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_URL}/study-logs`, {
  method: "POST",
  keepalive: true,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ planId: plan.id,
    planTitle: plan.title,
    date: new Date().toISOString(),
    durationMins,}),
});
  };
}, []);

  useEffect(() => {
    setMilestones((prev) =>
      prev.map((ms) => ({
        ...ms,
        completed: progress >= ms.targetPercent,
      })),
    );
  }, [progress, milestoneVersion]);

  if (!plan) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar displaying study plan title and description*/}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-6 py-4">
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {plan.title}
            </h1>
            {plan.description && (
              <p className="text-sm text-gray-500 truncate">
                {plan.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Tabs to access indiviudal components  */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {allTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* progress bar */}
        {activeTab === "To-Do List" && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Progress
              </span>
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "8px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#e0e7ff",
                  borderRadius: "9999px",
                  height: "8px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${progress}%`,
                  backgroundColor: "#4f46e5",
                  borderRadius: "9999px",
                  height: "8px",
                  transition: "width 0.3s ease",
                }}
              />
              {milestones.map((ms) => (
                <div
                  key={ms._id}
                  title={ms.title}
                  style={{
                    position: "absolute",
                    top: "-4px",
                    left: `${ms.targetPercent}%`,
                    transform: "translateX(-50%)",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: ms.completed ? "#4f46e5" : "#fff",
                    border: "2px solid #4f46e5",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setShowMilestoneModal(true)}
              style={{
                fontSize: "0.75rem",
                color: "#4f46e5",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Manage Milestones
            </button>
          </div>
        )}

        {/* Rendering selected component*/}
        {activeTab === "To-Do List" && (
          <ToDoList
            studyPlanId={planId}
            toDoListId={planId}
            onProgressChange={(progress) => setProgress(progress)}
          />
        )}

        {activeTab === "Notes" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <NotePage studyPlanId={planId} />
          </div>
        )}

        {activeTab === "Grade Book" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <GradeBookPage studyPlanId={planId} />
          </div>
        )}

        {activeTab === "Practice Questions" && (
          <PracticeQuestionsPage studyPlanId={planId} />
        )}

        {activeTab === "Course Info" && (
          <WorkloadPage plan={plan} setStudyPlans={setStudyPlans} />
        )}
      </div>
      {showMilestoneModal && (
        <MilestonesModal
          studyPlanId={planId}
          milestones={milestones}
          setMilestones={setMilestones}
          setStudyPlans={setStudyPlans}
          setMilestoneVersion={setMilestoneVersion}
          onClose={() => setShowMilestoneModal(false)}
        />
      )}
    </div>
  );
};

export default StudyPlanPage;
