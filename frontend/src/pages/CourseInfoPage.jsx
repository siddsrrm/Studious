import React, { useState, useEffect } from "react";

const WorkloadPage = ({ plan, setStudyPlans }) => {
  const [creditHours, setCreditHours] = useState("");
  const [workload, setWorkload] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setCreditHours(plan.creditHours ?? "");
    setWorkload(plan.workload ?? "");
  }, [plan]);

  async function handleSave() {
    if (creditHours === "" || workload === "") {
      setError("Both fields are required.");
      return;
    }

    setSaving(true);
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
            creditHours: Number(creditHours),
            workload: Number(workload),
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setStudyPlans((prev) =>
          prev.map((p) =>
            p.id === plan.id
              ? {
                  ...p,
                  creditHours: creditHours === "" ? null : Number(creditHours),
                  workload: workload === "" ? null : Number(workload),
                }
              : p,
          ),
        );
        setSuccess("Saved successfully!");
      } else {
        setError(data.message || "Failed to save.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setClearing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/study-plans/${plan.id}`,
        {
          method: "PATCH", // still PATCH, not DELETE
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            creditHours: null,
            workload: null,
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        // update parent state
        setStudyPlans((prev) =>
          prev.map((p) =>
            p.id === plan.id
              ? {
                  ...p,
                  creditHours: null,
                  workload: null,
                }
              : p,
          ),
        );

        // clear local inputs
        setCreditHours("");
        setWorkload("");

        setSuccess("Cleared successfully!");
      } else {
        setError(data.message || "Failed to clear.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Course Info</h2>
      <label className="block mb-2 text-sm">Credit Hours</label>
      <input
        type="number"
        value={creditHours}
        onChange={(e) => {
          setCreditHours(e.target.value);
          setSuccess("");
          setError("");
        }}
        placeholder="e.g. 3"
        className="w-full border p-2 rounded mb-4"
      />
      <label className="block mb-2 text-sm">
        Estimated Weekly Workload (hrs)
      </label>
      <input
        type="number"
        value={workload}
        onChange={(e) => {
          setWorkload(e.target.value);
          setSuccess("");
          setError("");
        }}
        placeholder="e.g. 10"
        className="w-full border p-2 rounded mb-4"
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-2">{success}</p>}
      <button
        onClick={handleSave}
        disabled={saving || clearing || creditHours === "" || workload === ""}
        className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        onClick={handleDelete}
        disabled={saving || clearing || creditHours === "" || workload === ""}
        className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {clearing ? "Clearing..." : "Clear"}
      </button>
    </div>
  );
};

export default WorkloadPage;
