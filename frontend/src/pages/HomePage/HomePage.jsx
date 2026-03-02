import React, { useState } from "react";
import CreatePlanForm from "../../components/StudyPlans/CreatePlanForm";
import PlanCard from "../../components/StudyPlans/PlanCard";
import StudyPlanPage from "../StudyPlanPage";

const HomePage = () => {
  // ---- state ----
  const [studyPlans, setStudyPlans] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [activeTab, setActiveTab] = useState("todo");

  // ---- handlers ----
  const handleCreatePlan = (newPlan) => {
    setStudyPlans((prev) => [...prev, newPlan]);
    setShowCreateForm(false);
  };

  const handleDeletePlan = (planId) => {
    setStudyPlans((prev) => prev.filter((p) => p.id !== planId));
    if (activePlan?.id === planId) setActivePlan(null);
  };

  const handleSelectPlan = (plan) => {
    setActivePlan(plan);
    setActiveTab("todo");
  };

  const handleBack = () => {
    setActivePlan(null);
  };

  // detail view moved to StudyPlanPage component
  if (activePlan) {
    return <StudyPlanPage plan={activePlan} onBack={handleBack} />;
  }

  // ================= HOME / PLAN GRID VIEW =================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Studious</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Study Plan
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {studyPlans.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">&#128214;</span>
            <h2 className="text-xl font-semibold text-gray-700">
              No study plans yet
            </h2>
            <p className="text-gray-500 mt-1 mb-6 max-w-sm">
              Create your first study plan to start organising your notes,
              tasks, and practice questions.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow"
            >
              + Create Study Plan
            </button>
          </div>
        ) : (
          /* Plan grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={handleSelectPlan}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create plan modal */}
      {showCreateForm && (
        <CreatePlanForm
          onCreatePlan={handleCreatePlan}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
