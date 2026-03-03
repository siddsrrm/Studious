import React, { useState, useEffect } from "react";
import CreatePlanForm from "../../components/StudyPlans/CreatePlanForm";
import PlanCard from "../../components/StudyPlans/PlanCard";
import StudyPlanPage from "../StudyPlanPage";

const HomePage = () => {
  // Current States
  const [studyPlans, setStudyPlans] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [activeTab, setActiveTab] = useState("todo");
  const [showToken, setShowToken] = useState(true)
  const [tokenOpacity, setTokenOpacity] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setTokenOpacity(false), 2000);
    const hideTimer = setTimeout(() => setShowToken(false), 5000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Handle creation and deletion of study plans
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

  // Renders study plan interface
  if (activePlan) {
    return <StudyPlanPage plan={activePlan} onBack={handleBack} />;
  }

  // Homepage view
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
        {/* Custom message if no study plans are created*/}
        {studyPlans.length === 0 ? (
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
          // Grid of study plans
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

      {showCreateForm && (
        <CreatePlanForm
          onCreatePlan={handleCreatePlan}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showToken && (
        <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-72 border border-gray-200 transition-opacity duration-1000 ${tokenOpacity ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-gray-700 mb-1">Session Active</p>
          <p className="text-xs text-gray-400 truncate">
            {localStorage.getItem("token")}
          </p>
        </div>
      )}    
    </div>
  );
};

export default HomePage;
