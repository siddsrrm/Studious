import React, { useState } from "react";
import ToDoList from "../components/ToDoList";
import NoteEditor from "../components/NoteEditor";
import NotePage from "./NotePage";
import PracticeQuestionsPage from "./PracticeQuestionsPage";

const StudyPlanPage = ({ plan, onBack }) => {
  const [activeTab, setActiveTab] = useState("To-Do List");
  const allTabs = ["To-Do List", "Notes", "PracticeQuestions"];
  const [progress, setProgress] = useState(0);

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
              width: "100%",
              backgroundColor: "#e0e7ff",
              borderRadius: "9999px",
              height: "8px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: "#4f46e5",
                borderRadius: "9999px",
                height: "8px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Rendering selected component*/}
        {activeTab === "To-Do List" && (
          <ToDoList
            studyPlanId={plan.id}
            toDoListId={plan.id}
            onProgressChange={(progress) => setProgress(progress)}
          />
        )}

        {activeTab === "Notes" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <NotePage studyPlanId={plan.id} />
          </div>
        )}

        {activeTab === "PracticeQuestions" && (
          <PracticeQuestionsPage studyPlanId={plan.id} />
        )}
      </div>
    </div>
  );
};

export default StudyPlanPage;
