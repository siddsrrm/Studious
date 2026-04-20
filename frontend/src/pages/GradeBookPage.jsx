import { useState, useEffect } from "react";
import "../css/GradeBook.css";

const API = import.meta.env.VITE_API_URL;

const TYPES = ["assignment", "project", "exam"];

const TYPE_COLORS = {
    assignment: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    project: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    exam: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

const emptyForm = { title: "", type: "assignment", score: "", weight: "", dueDate: "", notes: "" };

const getLetterGrade = (score) => {
    if (score >= 90) return { letter: "A", color: "#15803d" };
    if (score >= 80) return { letter: "B", color: "#1d4ed8" };
    if (score >= 70) return { letter: "C", color: "#b45309" };
    if (score >= 60) return { letter: "D", color: "#c2410c" };
    return { letter: "F", color: "#b91c1c" };
};

const GradeBookPage = ({ studyPlanId }) => {
    const [entries, setEntries] = useState([]);
    const [overallGrade, setOverallGrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchGradeBook();
    }, [studyPlanId]);

    const fetchGradeBook = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API}/gradebook/${studyPlanId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setEntries(data.entries || []);
                setOverallGrade(data.overallGrade);
            } else {
                setError(data.message || "Failed to load grade book.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        if (!form.title.trim()) return "Title is required.";
        if (!TYPES.includes(form.type)) return "Please select a valid type.";
        const score = Number(form.score);
        if (form.score === "" || isNaN(score) || score < 0 || score > 100)
            return "Score must be a number between 0 and 100.";
        if (form.weight !== "") {
            const weight = Number(form.weight);
            if (isNaN(weight) || weight < 0 || weight > 100)
                return "Weight must be a number between 0 and 100.";
        }
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) { setError(validationError); return; }
        setError("");

        const payload = {
            title: form.title.trim(),
            type: form.type,
            score: Number(form.score),
            weight: form.weight !== "" ? Number(form.weight) : null,
            dueDate: form.dueDate || null,
            notes: form.notes,
        };

        try {
            const url = editingId
                ? `${API}/gradebook/${studyPlanId}/entries/${editingId}`
                : `${API}/gradebook/${studyPlanId}/entries`;
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setEntries(data.entries || []);
                setOverallGrade(data.overallGrade);
                handleCancelForm();
            } else {
                setError(data.message || "Failed to save entry.");
            }
        } catch {
            setError("Network error. Please try again.");
        }
    };

    const handleEdit = (entry) => {
        setForm({
            title: entry.title,
            type: entry.type,
            score: String(entry.score),
            weight: entry.weight !== null && entry.weight !== undefined ? String(entry.weight) : "",
            dueDate: entry.dueDate ? entry.dueDate.split("T")[0] : "",
            notes: entry.notes || "",
        });
        setEditingId(entry._id);
        setShowForm(true);
        setError("");
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/gradebook/${studyPlanId}/entries/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setEntries(data.entries || []);
                setOverallGrade(data.overallGrade);
            } else {
                setError(data.message || "Failed to delete entry.");
            }
        } catch {
            setError("Network error. Please try again.");
        }
    };

    const handleCancelForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const letterGrade = overallGrade !== null ? getLetterGrade(overallGrade) : null;
    const hasWeights = entries.length > 0 && entries.every(e => e.weight !== null && e.weight !== undefined);

    if (loading) return <p className="gradebook-loading">Loading grade book...</p>;

    return (
        <div className="gradebook-container">

            {/* Overall grade banner */}
            <div className="gradebook-banner">
                <div>
                    <p className="gradebook-banner-label">Overall Grade</p>
                    {overallGrade !== null ? (
                        <div className="gradebook-banner-score">
                            <span className="gradebook-overall-percent">{overallGrade.toFixed(2)}%</span>
                            <span className="gradebook-overall-letter" style={{ color: letterGrade.color }}>
                                {letterGrade.letter}
                            </span>
                        </div>
                    ) : (
                        <p className="gradebook-banner-empty">No entries yet</p>
                    )}
                    <p className="gradebook-banner-meta">
                        {hasWeights ? "Weighted average" : "Simple average"} · {entries.length} {entries.length === 1 ? "entry" : "entries"}
                    </p>
                </div>
                <button
                    className="gradebook-add-btn"
                    onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
                >
                    + Add Entry
                </button>
            </div>

            {error && <p className="gradebook-error">{error}</p>}

            {/* Add / Edit form */}
            {showForm && (
                <div className="gradebook-form-card">
                    <p className="gradebook-form-title">{editingId ? "Edit Entry" : "New Entry"}</p>

                    <div className="gradebook-form-grid">
                        <div className="gradebook-form-full">
                            <label className="gradebook-label">Title</label>
                            <input
                                className="gradebook-input"
                                placeholder="e.g. Midterm Exam"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="gradebook-label">Type</label>
                            <select
                                className="gradebook-input"
                                value={form.type}
                                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                            >
                                {TYPES.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="gradebook-label">Score (0–100)</label>
                            <input
                                className="gradebook-input"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="e.g. 88"
                                value={form.score}
                                onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="gradebook-label">
                                Weight % <span className="gradebook-label-optional">(optional)</span>
                            </label>
                            <input
                                className="gradebook-input"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="e.g. 30"
                                value={form.weight}
                                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="gradebook-label">
                                Due Date <span className="gradebook-label-optional">(optional)</span>
                            </label>
                            <input
                                className="gradebook-input"
                                type="date"
                                value={form.dueDate}
                                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            />
                        </div>

                        <div className="gradebook-form-full">
                            <label className="gradebook-label">
                                Notes <span className="gradebook-label-optional">(optional)</span>
                            </label>
                            <textarea
                                className="gradebook-input gradebook-textarea"
                                placeholder="Any additional notes..."
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="gradebook-form-actions">
                        <button className="gradebook-cancel-btn" onClick={handleCancelForm}>Cancel</button>
                        <button className="gradebook-save-btn" onClick={handleSubmit}>
                            {editingId ? "Save Changes" : "Add Entry"}
                        </button>
                    </div>
                </div>
            )}

            {/* Entries list */}
            {entries.length === 0 ? (
                <div className="gradebook-empty">
                    <p>No grade entries yet.</p>
                    <p className="gradebook-empty-sub">Click "Add Entry" to get started.</p>
                </div>
            ) : (
                <div className="gradebook-entries">
                    {entries.map((entry) => {
                        const typeColor = TYPE_COLORS[entry.type] || TYPE_COLORS.assignment;
                        const letter = getLetterGrade(entry.score);
                        return (
                            <div key={entry._id} className="gradebook-entry-card">
                                <span
                                    className="gradebook-type-badge"
                                    style={{
                                        backgroundColor: typeColor.bg,
                                        color: typeColor.text,
                                        border: `1px solid ${typeColor.border}`,
                                    }}
                                >
                                    {entry.type}
                                </span>

                                <div className="gradebook-entry-info">
                                    <p className="gradebook-entry-title">{entry.title}</p>
                                    <p className="gradebook-entry-meta">
                                        {entry.dueDate ? `Due: ${new Date(entry.dueDate).toLocaleDateString()}` : "No due date"}
                                        {entry.weight !== null && entry.weight !== undefined ? ` · Weight: ${entry.weight}%` : ""}
                                        {entry.notes ? ` · ${entry.notes}` : ""}
                                    </p>
                                </div>

                                <div className="gradebook-entry-score">
                                    <span className="gradebook-score-percent">{entry.score}%</span>
                                    <span className="gradebook-score-letter" style={{ color: letter.color }}>
                                        {letter.letter}
                                    </span>
                                </div>

                                <div className="gradebook-entry-actions">
                                    <button className="gradebook-edit-btn" onClick={() => handleEdit(entry)}>Edit</button>
                                    <button className="gradebook-delete-btn" onClick={() => handleDelete(entry._id)}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GradeBookPage;