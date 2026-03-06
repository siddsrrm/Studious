import React, { useState } from "react";

const PlanCard = ({ plan, onSelect, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div
      onClick={() => onSelect(plan)}
      className="group cursor-pointer bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
            {plan.title}
          </h3>
          {plan.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {plan.description}
            </p>
          )}
        </div>

        {/* Delete button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
            title="Delete plan"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          </button>

          {confirmOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-10 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
            >
              <p className="text-sm text-gray-700 mb-2">Delete this study plan?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(false);
                    onDelete(plan.id);
                  }}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PlanCard;
