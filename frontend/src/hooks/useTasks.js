import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

export const useTasks = (studyPlanId) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API}/tasks?studyPlanId=${studyPlanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setTasks(data);
      } catch {
        console.log("Failed to load tasks");
      }
    })();
  }, [studyPlanId]);

  const createTask = async (form) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setTasks((prev) => [
        ...prev,
        { ...form, _id: Date.now().toString(), subTasks: [] },
      ]);
      return;
    }

    try {
      const res = await fetch(`${API}/tasks?studyPlanId=${studyPlanId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, studyPlanID: studyPlanId }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setTasks((prev) => [...prev, data]);
    } catch {
      console.log("Failed to create task.");

      // fallback
      setTasks((prev) => [
        ...prev,
        { ...form, _id: Date.now().toString(), subTasks: [] },
      ]);
    }
  };

  const editTask = async (taskId, form) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const updatedTask = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
      );
    } catch {
      console.log("Failed to update event");

      // fallback
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, ...form } : t)),
      );
    }
  };

  const deleteTask = async (taskId) => {
    const token = localStorage.getItem("token");

    try {
      await fetch(`${API}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      console.log("Failed to delete event");
    }

    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  return {
    tasks,
    createTask,
    editTask,
    deleteTask,
  };
};
