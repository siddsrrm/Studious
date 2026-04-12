import React, { useMemo, useState } from "react";

export default function GeneratePlanFromSyllabusModal({ onClose, onCreatePlan }) {
  const token = localStorage.getItem("token");

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

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

      // UI-first: this delegates persistence to HomePage.handleCreatePlan.
      onCreatePlan({
        id: Date.now().toString(),
        title: inferredTitle || "Generated Study Plan",
        description,
        notes: [],
        to_do_list: [],
        practiceQuestions: [],
        createdAt: new Date().toISOString(),
      });

      onClose();
    } catch (e) {
      setError(e?.message || "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Generate study plan from syllabus</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
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

        {preview && (
          <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-white">
            <p className="text-xs font-semibold text-gray-600 mb-2">Extracted preview</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-auto">{preview}</pre>
          </div>
        )}

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
