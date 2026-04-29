import React from 'react';

export default function GenerateFromWrongModal({ onClose, onGenerate, disabled }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Generate from incorrect answers</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          This will generate practice questions by analysing the questions you've answered incorrectly in the past. It focuses study on weak areas.
        </p>


        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {disabled ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
