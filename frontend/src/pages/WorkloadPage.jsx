import React, { useState, useEffect } from "react";

const WorkloadPage = ({ plan, setStudyPlans }) => {
  const [creditHours, setCreditHours] = useState("");
  const [workload, setWorkload] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setCreditHours(plan.creditHours || "");
    setWorkload(plan.workload || "");
  }, [plan]);

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/study-plans/${plan.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            creditHours,
            workload,
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setStudyPlans((prev) =>
          prev.map((p) =>
            p.id === plan.id ? { ...p, creditHours, workload } : p,
          ),
        );
        setSuccess("Saved successfully!");
      } else {
        setError(data.message || "Failed to save.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Course Info</h2>

      <label className="block mb-2 text-sm">Credit Hours</label>
      <input
        type="number"
        value={creditHours}
        onChange={(e) => setCreditHours(Number(e.target.value))}
        className="w-full border p-2 rounded mb-4"
      />

      <label className="block mb-2 text-sm">
        Estimated Weekly Workload (hrs)
      </label>
      <input
        type="number"
        value={workload}
        onChange={(e) => setWorkload(Number(e.target.value))}
        className="w-full border p-2 rounded mb-4"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default WorkloadPage;
