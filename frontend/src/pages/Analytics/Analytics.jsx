import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./analytics.module.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getWeekLabel = (offset = 0) => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
};

const getWeekRange = (offset = 0) => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

const formatHours = (mins) => {
  if (mins === 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Pastel palette for courses
const COURSE_COLORS = [
  { bg: "#e0e7ff", bar: "#6366f1", text: "#4338ca" }, // indigo
  { bg: "#fce7f3", bar: "#ec4899", text: "#be185d" }, // pink
  { bg: "#d1fae5", bar: "#10b981", text: "#065f46" }, // emerald
  { bg: "#fef3c7", bar: "#f59e0b", text: "#92400e" }, // amber
  { bg: "#dbeafe", bar: "#3b82f6", text: "#1e40af" }, // blue
  { bg: "#ede9fe", bar: "#8b5cf6", text: "#5b21b6" }, // violet
  { bg: "#fee2e2", bar: "#ef4444", text: "#991b1b" }, // red
  { bg: "#ccfbf1", bar: "#14b8a6", text: "#0f766e" }, // teal
];

// ─── Mock data generator (replace with real API calls) ──────────────────────

const generateMockLogs = (studyPlans) => {
  // Returns array of { planId, planTitle, date, durationMins }
  const logs = [];
  const now = new Date();

  studyPlans.forEach((plan, i) => {
    // Generate random sessions over the past 5 weeks
    for (let week = 0; week < 5; week++) {
      const sessionsThisWeek = Math.floor(Math.random() * 5);
      for (let s = 0; s < sessionsThisWeek; s++) {
        const dayOffset = Math.floor(Math.random() * 7);
        const d = new Date(now);
        d.setDate(d.getDate() - week * 7 - dayOffset);
        logs.push({
          planId: plan.id,
          planTitle: plan.title,
          date: new Date(d),
          durationMins: Math.floor(Math.random() * 90) + 15,
        });
      }
    }
  });
  return logs;
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className={`${styles.statCard} bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4`}>
    <div className={`${styles.statIcon} rounded-lg p-3`} style={{ background: color + "20" }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const CourseBar = ({ title, minutes, maxMinutes, color, rank }) => {
  const pct = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
  return (
    <div className={styles.courseRow}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: color.bg, color: color.text }}
          >
            {rank}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
            {title}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-600 ml-2 shrink-0">
          {formatHours(minutes)}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${styles.barFill} h-2.5 rounded-full`}
          style={{ width: `${pct}%`, background: color.bar }}
        />
      </div>
    </div>
  );
};

const DailyChart = ({ dailyData }) => {
  const max = Math.max(...dailyData.map((d) => d.mins), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-28 px-1">
      {dailyData.map((d, i) => {
        const heightPct = (d.mins / max) * 100;
        const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
        return (
          <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs text-gray-400">{d.mins > 0 ? formatHours(d.mins) : ""}</span>
            <div className="w-full flex items-end" style={{ height: "72px" }}>
              <div
                className={`${styles.dayBar} w-full rounded-t-md transition-all duration-500`}
                style={{
                  height: `${Math.max(heightPct, d.mins > 0 ? 8 : 2)}%`,
                  background: isToday ? "#6366f1" : "#c7d2fe",
                  minHeight: "3px",
                }}
                title={`${d.day}: ${formatHours(d.mins)}`}
              />
            </div>
            <span
              className={`text-xs font-medium ${isToday ? "text-indigo-600" : "text-gray-400"}`}
            >
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [studyPlans, setStudyPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load study plans
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
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
        }));
        setStudyPlans(normalized);

        // ── Replace this block with a real API call to /study-logs ──────────
        // e.g. const logsRes = await fetch(`${import.meta.env.VITE_API_URL}/study-logs`, ...)
        // const logsData = await logsRes.json()
        // setLogs(logsData)
        // ──────────────────────────────────────────────────────────────────
        setLogs(generateMockLogs(normalized));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived stats for selected week ───────────────────────────────────────

  const { start, end } = getWeekRange(weekOffset);

  const weekLogs = logs.filter((l) => l.date >= start && l.date <= end);

  // Total minutes this week
  const totalMinsWeek = weekLogs.reduce((s, l) => s + l.durationMins, 0);

  // Total minutes all time
  const totalMinsAll = logs.reduce((s, l) => s + l.durationMins, 0);

  // Sessions this week
  const sessionsWeek = weekLogs.length;

  // Per-course breakdown for selected week
  const courseMap = {};
  studyPlans.forEach((p) => {
    courseMap[p.id] = { title: p.title, mins: 0 };
  });
  weekLogs.forEach((l) => {
    if (courseMap[l.planId]) courseMap[l.planId].mins += l.durationMins;
    else courseMap[l.planId] = { title: l.planTitle, mins: l.durationMins };
  });
  // Ensure all courses appear (with 0 if no data)
  studyPlans.forEach((p) => {
    if (!courseMap[p.id]) courseMap[p.id] = { title: p.title, mins: 0 };
  });

  const courseBreakdown = Object.entries(courseMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.mins - a.mins);

  const maxCourseMins = Math.max(...courseBreakdown.map((c) => c.mins), 1);

  // Daily breakdown for selected week (Mon–Sun)
  const dailyData = DAYS.map((day, i) => {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    const mins = weekLogs
      .filter((l) => {
        const d = new Date(l.date);
        return (
          d.getFullYear() === dayDate.getFullYear() &&
          d.getMonth() === dayDate.getMonth() &&
          d.getDate() === dayDate.getDate()
        );
      })
      .reduce((s, l) => s + l.durationMins, 0);
    return { day, mins };
  });

  // Average session length this week
  const avgSession =
    sessionsWeek > 0 ? Math.round(totalMinsWeek / sessionsWeek) : 0;

  // Most studied course this week
  const topCourse = courseBreakdown[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">Analytics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className={styles.spinner} />
          </div>
        ) : (
          <>
            {/* Week selector */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Study Overview</h2>
                <p className="text-sm text-gray-500">{getWeekLabel(weekOffset)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  aria-label="Previous week"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  disabled={weekOffset === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-600"
                >
                  This Week
                </button>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  disabled={weekOffset === 0}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next week"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Total This Week"
                value={formatHours(totalMinsWeek)}
                color="#6366f1"
              />
              <StatCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                label="Sessions"
                value={sessionsWeek}
                sub="this week"
                color="#10b981"
              />
              <StatCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                label="Avg. Session"
                value={formatHours(avgSession)}
                sub="per session"
                color="#f59e0b"
              />
              <StatCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                }
                label="All-Time Total"
                value={formatHours(totalMinsAll)}
                color="#8b5cf6"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily bar chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-4">Daily Breakdown</h3>
                {totalMinsWeek === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 text-gray-400">
                    <span className="text-3xl mb-2">📭</span>
                    <p className="text-sm">No study sessions recorded this week.</p>
                  </div>
                ) : (
                  <DailyChart dailyData={dailyData} />
                )}
              </div>

              {/* Top course highlight */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-4">Top Course This Week</h3>
                {topCourse && topCourse.mins > 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-28">
                    <div
                      className="rounded-xl px-5 py-3 text-center"
                      style={{
                        background: COURSE_COLORS[0].bg,
                        color: COURSE_COLORS[0].text,
                      }}
                    >
                      <p className="text-lg font-bold">{topCourse.title}</p>
                      <p className="text-sm font-medium opacity-80">{formatHours(topCourse.mins)} studied</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {Math.round((topCourse.mins / totalMinsWeek) * 100)}% of your weekly study time
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-gray-400">
                    <span className="text-3xl mb-2">🎯</span>
                    <p className="text-sm">Start studying to see your top course!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Course breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-5">Time by Course</h3>
              {courseBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No courses found. Create a study plan to get started.</p>
              ) : (
                <div className="space-y-4">
                  {courseBreakdown.map((course, i) => (
                    <CourseBar
                      key={course.id}
                      title={course.title}
                      minutes={course.mins}
                      maxMinutes={maxCourseMins}
                      color={COURSE_COLORS[i % COURSE_COLORS.length]}
                      rank={i + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;