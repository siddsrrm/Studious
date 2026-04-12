import React, { useState } from "react";
import GeneratePlanFromSyllabusModal from "./GeneratePlanFromSyllabusModal";

const CreatePlanForm = ({ onCreatePlan, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreatePlan({
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      notes: [],
      to_do_list: [],
      practiceQuestions: [],
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Create New Study Plan
        </h2>

        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-indigo-900">Generate from syllabus/schedule</p>
              <p className="text-xs text-indigo-900/70 mt-1">
                Upload a course syllabus or schedule (PDF) and we’ll create a starter study plan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGenerator(true)}
              className="shrink-0 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Upload
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="plan-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="plan-title"
              type="text"
              placeholder="e.g. Midterm Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="plan-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="plan-description"
              rows={3}
              placeholder="What is this study plan about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Create Plan
            </button>
          </div>
        </form>

        {showGenerator && (
          <GeneratePlanFromSyllabusModal
            onClose={() => setShowGenerator(false)}
            onCreatePlan={onCreatePlan}
          />
        )}
      </div>
    </div>
  );
};

export default CreatePlanForm;
