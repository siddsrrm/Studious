import React, { useMemo, useState } from "react";

export default function GeneratePlanFromSyllabusModal({ onClose, onCreatePlan, onPlanReady }) {
  const token = localStorage.getItem("token");

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [includeTasks, setIncludeTasks] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  const canGenerate = useMemo(() => !!file && !loading, [file, loading]);

  const handleGenerate = async () => {
    setError("");
    setPreview("");

    if (!file) return;
    if (!token) {
      setError("Please log in to use syllabus upload.");
      return;
    }

    setLoading(true);
    try {
      if (includeTasks) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
          throw new Error("Please provide valid start and end dates.");
        }
        if (e.getTime() < s.getTime()) {
          throw new Error("End date must be after start date.");
        }
      }

      const formData = new FormData();
      formData.append("file", file);

      // Reuse existing extractor used by AI-notes upload.
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      const text = (data?.text || "").trim();
      if (!text) throw new Error("No text extracted from PDF.");

      const inferredTitle = (file.name || "Syllabus").replace(/\.pdf$/i, "").slice(0, 60);
      const description = `Generated from uploaded syllabus: ${file.name}\n\nPreview:\n${text.slice(0, 800)}${text.length > 800 ? "…" : ""}`;
      setPreview(text.slice(0, 800));

      // Ask parent to create plan in backend, but defer showing it in the UI until
      // task generation finishes (avoids the plan "popping in" before tasks exist).
      const createdPlan = await onCreatePlan(
        {
          id: Date.now().toString(),
          title: inferredTitle || "Generated Study Plan",
          description,
          notes: [],
          to_do_list: [],
          practiceQuestions: [],
          createdAt: new Date().toISOString(),
        },
        { deferRender: true }
      );

      // Optionally generate tasks from syllabus text into the new plan.
      const planId = createdPlan?.id;
      if (includeTasks && planId) {
        const taskRes = await fetch(`${import.meta.env.VITE_API_URL}/upload/generate-tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studyPlanId: planId,
            syllabusText: text,
            startDate,
            endDate,
            maxTasks: 18,
          }),
        });
        if (!taskRes.ok) {
          // Don't fail the whole flow if tasks fail; we already created the plan.
          const errText = await taskRes.text().catch(() => "");
          console.warn("Task generation failed:", errText);
          setError(
            `Study plan created, but task generation failed: ${errText || `(${taskRes.status})`}`
          );
          return;
        }

        // If tasks succeed, still wait for the response so the user doesn't see an "instant" completion.
        // (Also helps surface unexpected non-JSON responses in dev.)
        await taskRes.json().catch(() => null);
      }

      // Tell parent it's safe to show the plan now.
      if (typeof onPlanReady === "function") {
        onPlanReady(createdPlan);
      }

      onClose();
    } catch (e) {
      setError(e?.message || "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={loading ? undefined : onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Generate study plan from syllabus</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Upload a course syllabus or schedule in PDF format.
        </p>

        <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
          <input
            type="file"
            accept="application/pdf"
            className="block w-full text-sm text-gray-700"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            aria-label="Syllabus PDF"
          />
          <p className="text-xs text-gray-500 mt-2">Supported: PDF up to 20MB.</p>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-white">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeTasks}
              onChange={(e) => setIncludeTasks(e.target.checked)}
            />
            Generate To-Do tasks from syllabus
          </label>

          {includeTasks && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
