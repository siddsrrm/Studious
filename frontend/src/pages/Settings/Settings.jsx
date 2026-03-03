import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.css";

const API_BASE = import.meta.env.VITE_API_URL;

const SECTIONS = {
  USERNAME: "username",
  DELETE: "delete",
};

function UsernameSection({ oldUsername, setOldUsername }) {
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  async function handleNameChange() {
    if (!newUsername.trim()) { setUsernameError("Username cannot be empty."); return; }
    setLoading(true);
    setUsernameError("");
    setUsernameSuccess("");
    try {
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
        setUsernameSuccess("Username updated successfully.");
        localStorage.setItem("username", newUsername);
        setOldUsername(newUsername);
        setNewUsername("");
      } else {
        setUsernameError(data.message || "Failed to update username.");
      }
    } catch {
      setUsernameError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.contentTitle}>Change Username</h2>
      <p className={styles.contentDescription}>Update the name displayed on your account.</p>
      <hr className={styles.contentDivider} />
      <p className={styles.fieldLabel}>New username</p>
      <input
        type="text"
        placeholder={oldUsername}
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
        onFocus={() => { setUsernameError(""); setUsernameSuccess(""); }}
        disabled={loading}
        className={styles.input + (usernameError ? " " + styles.inputError : "")}
      />
      {usernameError && <p className={styles.error}>{usernameError}</p>}
      {usernameSuccess && <p className={styles.success}>{usernameSuccess}</p>}
      <button className={styles.button} onClick={handleNameChange} disabled={loading}>
        {loading ? "Saving..." : "Save Username"}
      </button>
    </div>
  );
}

function DeleteSection() {
  const [showModal, setShowModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  async function handleDeleteAccount() {
    setLoading(true);
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
          localStorage.removeItem("username");
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
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.contentTitle}>Delete Account</h2>
      <p className={styles.contentDescription}>Permanently remove your account from Studious.</p>
      <hr className={styles.contentDivider} />
      <div className={styles.warningBox}>
        Once you delete your account, all of your data will be permanently removed
        and cannot be recovered. Please be certain before continuing.
      </div>
      {deleteStatus && <p className={styles.error}>{deleteStatus}</p>}
      <button className={styles.buttonDanger} onClick={() => setShowModal(true)} disabled={loading}>
        Delete My Account
      </button>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Delete your account?</p>
            <p className={styles.modalBody}>
              This will permanently delete your account and all associated data.
              There is no way to recover it after confirmation.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnConfirm} onClick={handleDeleteAccount} disabled={loading}>
                {loading ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(SECTIONS.USERNAME);
  const [oldUsername, setOldUsername] = useState(localStorage.getItem("username") || "User");

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate("/home")}>
          ← Back
        </button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {oldUsername}!</p>
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <p className={styles.sidebarHeading}>Account</p>

        <button
          className={`${styles.sidebarItem} ${activeSection === SECTIONS.USERNAME ? styles.sidebarItemActive : ""}`}
          onClick={() => setActiveSection(SECTIONS.USERNAME)}
        >
          Change Username
        </button>

        <hr className={styles.sidebarDivider} />

        <p className={styles.sidebarHeading}>Danger Zone</p>

        <button
          className={`${styles.sidebarItem} ${styles.sidebarItemDanger} ${activeSection === SECTIONS.DELETE ? styles.sidebarItemDangerActive : ""}`}
          onClick={() => setActiveSection(SECTIONS.DELETE)}
        >
          Delete Account
        </button>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {activeSection === SECTIONS.USERNAME && (
          <UsernameSection oldUsername={oldUsername} setOldUsername={setOldUsername} />
        )}
        {activeSection === SECTIONS.DELETE && (
          <DeleteSection />
        )}
      </div>

    </div>
  );
}
