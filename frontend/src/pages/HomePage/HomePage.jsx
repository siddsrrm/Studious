import React, { useState, useEffect, useRef } from "react";
import Calendar from "../../components/Calendar";
import CreatePlanForm from "../../components/StudyPlans/CreatePlanForm";
import PlanCard from "../../components/StudyPlans/PlanCard";
import StudyPlanPage from "../StudyPlanPage";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  // Current States
  const [studyPlans, setStudyPlans] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activePlanId, setActivePlanId] = useState(null);
  const [showToken, setShowToken] = useState(
    () => !sessionStorage.getItem("tokenShown"),
  );
  const [tokenOpacity, setTokenOpacity] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const activePlan = studyPlans.find((p) => p.id === activePlanId);

  useEffect(() => {
    if (showToken) {
      sessionStorage.setItem("tokenShown", "true");
      const fadeTimer = setTimeout(() => setTokenOpacity(false), 2000);
      const hideTimer = setTimeout(() => setShowToken(false), 5000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  // Load user's study plans from backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/study-plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const plans = await res.json();
        const normalized = plans.map((p) => ({
          id: p._id,
          title: p.title,
          description: p.description,
          notes: p.notes || [],
          to_do_list: p.to_do_list || [],
          practiceQuestions: p.practiceQuestions || [],
          milestones: p.milestones || [],
          creditHours: p.creditHours ?? null,
          workload: p.workload ?? null,
        }));
        setStudyPlans(normalized);
      } catch (err) {}
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    sessionStorage.removeItem("tokenShown");
    navigate("/login");
  };

  // Handle creation of study plans
  // Supports an optional options object: { deferRender: boolean }
  const handleCreatePlan = async (newPlan, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (!options.deferRender) {
        setStudyPlans((prev) => [...prev, newPlan]);
      }
      setShowCreateForm(false);
      return newPlan;
    }

    // Create study plan in backend
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/study-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newPlan.title,
          description: newPlan.description,
        }),
      });

      if (!res.ok) {
        if (!options.deferRender) {
          setStudyPlans((prev) => [...prev, newPlan]);
        }
        return newPlan;
      } else {
        const data = await res.json();
        const saved = data.studyPlan;
        const normalized = {
          id: saved._id,
          title: saved.title,
          description: saved.description,
          notes: saved.notes || [],
          to_do_list: saved.to_do_list || [],
          practiceQuestions: saved.practiceQuestions || [],
          milestones: saved.milestones || [],
          creditHours: saved.creditHours ?? null,
          workload: saved.workload ?? null,
        };
        if (!options.deferRender) {
          setStudyPlans((prev) => [...prev, normalized]);
        }
        return normalized;
      }
    } catch (err) {
      if (!options.deferRender) {
        setStudyPlans((prev) => [...prev, newPlan]);
      }
      return newPlan;
    } finally {
      if (!options.deferRender) {
        setShowCreateForm(false);
      }
    }
  };

  // Allows syllabus generation flow to add the created plan only after tasks are generated.
  const handlePlanReady = (createdPlan) => {
    if (!createdPlan) return;
    setStudyPlans((prev) => {
      const id = createdPlan?.id;
      if (!id) return prev;
      if (prev.some((p) => p.id === id)) return prev;
      return [...prev, createdPlan];
    });
  };

  // Handle deletion of study plans
  const handleDeletePlan = (planId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStudyPlans((prev) => prev.filter((p) => p.id !== planId));
      if (activePlan?.id === planId) setActivePlanId(null);
      return;
    }

    // Handle deletion of study plans in backend
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/study-plans/${planId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.ok) {
          setStudyPlans((prev) => prev.filter((p) => p.id !== planId));
          if (activePlan?.id === planId) setActivePlanId(null);
        } else {
          setStudyPlans((prev) => prev.filter((p) => p.id !== planId));
          if (activePlan?.id === planId) setActivePlanId(null);
        }
      } catch (err) {
        setStudyPlans((prev) => prev.filter((p) => p.id !== planId));
        if (activePlan?.id === planId) setActivePlanId(null);
      }
    })();
  };

  const handleSelectPlan = (plan) => {
    setActivePlanId(plan.id);
  };

  const handleBack = () => {
    setActivePlanId(null);
  };

  // Renders study plan interface
  if (activePlan) {
    return (
      <StudyPlanPage
        key={activePlan.id}
        plan={activePlan}
        onBack={handleBack}
        setStudyPlans={setStudyPlans}
      />
    );
  }

  // Homepage view
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Studious</h1>

          <div className="flex items-center gap-3">
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

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-gray-100 transition gap-1.5"
                aria-label="Menu"
              >
                <span
                  className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
                />
                <span
                  className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/people");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                      />
                    </svg>
                    Find People
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/friends");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6 3 3 0 000 6z"
                      />
                    </svg>
                    Friends
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/settings`);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/leaderboard");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Leaderboard
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/achievements");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    Achievements
                  </button>
                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container updated to max-w-7xl for more horizontal room */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/*Calendar */}
          <div className="w-full lg:w-5/12 bg-white p-4 rounded-lg shadow-md shrink-0">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 text-center">
              Calendar
            </h2>
            <div className="calendar-container">
              <Calendar />
            </div>
          </div>

          {/*Study Plans */}
          <div className="w-full lg:flex-1">
            {studyPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-lg shadow-sm border border-gray-100 h-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
        </div>
      </main>

      {showCreateForm && (
        <CreatePlanForm
          onCreatePlan={handleCreatePlan}
          onCancel={() => setShowCreateForm(false)}
          onPlanReady={handlePlanReady}
        />
      )}

      {showToken && (
        <div
          className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-72 border border-gray-200 transition-opacity duration-1000 ${tokenOpacity ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Session Active
          </p>
          <p className="text-xs text-gray-400 truncate">
            {localStorage.getItem("token")}
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
