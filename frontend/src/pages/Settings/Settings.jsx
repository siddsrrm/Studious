import { useState } from "react";
import styles from "./Settings.module.css";


export default function SettingsPage() {
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");
  const oldUsername = localStorage.getItem("username");


//function for name change


  async function handleNameChange() {
    if (!newUsername.trim()) {
      setUsernameError("Username cannot be empty.");
      return;
    }
    setUsernameLoading(true);
    setUsernameError("");
    setUsernameSuccess("");
    try {
        //post req to server to change username
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/nameChange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("username", newUsername);
        setUsernameSuccess("Username updated successfully.");
        setNewUsername("");
      } else {
        setUsernameError(data.message || "Failed to update username.");
      }
    } catch {
      setUsernameError("Network error. Please try again.");
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteStatus("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStatus("Account deleted. Redirecting...");
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }, 2000);
      } else {
        setDeleteStatus(data.message || "Failed to delete account.");
        setShowModal(false);
      }
    } catch {
      setDeleteStatus("Network error. Please try again.");
      setShowModal(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      <p>Current username: {oldUsername}</p>

      <input
        type="text"
        placeholder="New username"
        className={styles.input + (usernameError ? " " + styles.inputError : "")}
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
        onFocus={() => { setUsernameError(""); setUsernameSuccess(""); }}
        disabled={usernameLoading}
      />
      {usernameError && <p className={styles.error}>{usernameError}</p>}
      {usernameSuccess && <p>{usernameSuccess}</p>}

      <button className={styles.button} onClick={handleNameChange} disabled={usernameLoading}>
        {usernameLoading ? "Saving..." : "Save Username"}
      </button>

      <button className={styles.button} onClick={() => setShowModal(true)} disabled={deleteLoading}
        style={{ backgroundColor: "#dc3545" }}>
        Delete Account
      </button>
      {deleteStatus && <p className={styles.error}>{deleteStatus}</p>}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: "8px", padding: "30px", width: "320px", display: "flex", flexDirection: "column", gap: "10px" }}
            onClick={(e) => e.stopPropagation()}>
            <p style={{ fontWeight: 600 }}>Delete your account?</p>
            <p style={{ fontSize: "13px", color: "hsl(0,0%,40%)" }}>
              This will permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className={styles.button} style={{ backgroundColor: "transparent", color: "#333", border: "1px solid hsl(0,0%,80%)" }}
                onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={styles.button} style={{ backgroundColor: "#dc3545" }}
                onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
