import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
    const navigate = useNavigate();
    const [rankings, setRankings] = useState([]);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setRankings(data.rankings || []);
                setLastRefreshTime(data.lastRefreshTime || null);
            } else {
                setError(data.message || "Failed to load leaderboard.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setError("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/leaderboard/refresh`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setRankings(data.rankings || []);
                setLastRefreshTime(data.lastRefreshTime || null);
            } else {
                setError(data.message || "Failed to refresh leaderboard.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const getMedalColor = (rank) => {
        if (rank === 1) return "#f59e0b";
        if (rank === 2) return "#94a3b8";
        if (rank === 3) return "#b45309";
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate("/home")}
                        style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#374151", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", transition: "background-color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        ← Back
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-800">Leaderboard</h1>
                        {lastRefreshTime && (
                            <p className="text-sm text-gray-500">
                                Last updated: {new Date(lastRefreshTime).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: refreshing || loading ? "#94a3b8" : "#4f46e5",
                            color: "white",
                            fontSize: "0.875rem",
                            cursor: refreshing || loading ? "not-allowed" : "pointer",
                            transition: "background-color 0.2s ease",
                        }}
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 pt-6">
                {error && (
                    <p style={{ fontSize: "0.875rem", color: "#ef4444", marginBottom: "1rem" }}>
                        {error}
                    </p>
                )}

                {loading ? (
                    <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Loading leaderboard...</p>
                ) : rankings.length === 0 ? (
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "40px 20px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "0.95rem",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                    }}>
                        <p>No leaderboard data available.</p>
                        <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "4px" }}>
                            Data will appear once users have completed tasks.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {rankings.map((entry) => {
                            const medal = getMedalColor(entry.rank);
                            return (
                                <div
                                    key={entry.userID}
                                    style={{
                                        backgroundColor: "white",
                                        borderRadius: "12px",
                                        padding: "16px 20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                                        border: "1px solid #e5e7eb",
                                    }}
                                >
                                    {/* Rank badge */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        border: `2px solid ${medal ?? "#e5e7eb"}`,
                                        color: medal ?? "#6b7280",
                                        flexShrink: 0,
                                    }}>
                                        {medal ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={medal}>
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ) : (
                                            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>#{entry.rank}</span>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                                            {entry.username}
                                        </p>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ width: "40%", minWidth: "120px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Progress</span>
                                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                                {entry.score.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div style={{ width: "100%", backgroundColor: "#e0e7ff", borderRadius: "9999px", height: "8px" }}>
                                            <div style={{
                                                width: `${entry.score}%`,
                                                backgroundColor: "#4f46e5",
                                                borderRadius: "9999px",
                                                height: "8px",
                                                transition: "width 0.3s ease",
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;