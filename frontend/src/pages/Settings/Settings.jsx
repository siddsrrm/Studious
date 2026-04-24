import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.css";

const API_BASE = import.meta.env.VITE_API_URL;

const SECTIONS = {
  PROFILE: "profile",
  USERNAME: "username",
  EMAIL: "email",
  PRIVACY: "privacy",
  NOTIFICATION: "notification",
  TWO_FACTOR: "two_factor",
  GOOGLE: "google",
  DELETE: "delete"
};

const PRESET_AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png"
];

function PrivacySection() {
  const [visibility, setVisibility] = useState("public");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchPrivacy() {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setVisibility(data.profileVisibility || "public");
      } catch {
        // fail silently
      }
    }
    fetchPrivacy();
  }, []);

  async function handleSave() {
    setLoading(true);
    setSuccess(""); setError("");
    try {
      const res = await fetch(`${API_BASE}/users/privacy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profileVisibility: visibility })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Privacy settings saved.");
      } else {
        setError(data.message || "Failed to save privacy settings.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.contentTitle}>Privacy</h2>
      <p className={styles.contentDescription}>Control who can see your profile.</p>
      <hr className={styles.contentDivider} />
      <p className={styles.fieldLabel}>Profile visibility</p>
      <select
        className={styles.input}
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
      >
        <option value="public">Public — anyone can view your profile</option>
        <option value="friends">Friends Only — only friends can view your profile</option>
        <option value="hidden">Hidden — your profile is not visible to others</option>
      </select>
      {success && <p className={styles.success}>{success}</p>}
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.button} onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Privacy Settings"}
      </button>
    </div>
  );
}

function ProfileSection() {
  const [selected, setSelected] = useState(localStorage.getItem("avatar") || PRESET_AVATARS[0]);
  const [pending, setPending] = useState(selected);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const [displayName, setDisplayName] = useState("");
const [bio, setBio] = useState("");
const [location, setLocation] = useState("");

useEffect(() => {
  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDisplayName(data.displayName || "");
      setBio(data.bio || "");
      setLocation(data.location || "");
    } catch {
      // fail silently
    }
  }
  fetchProfile();
}, []);

  async function handleSave() {
    setLoading(true);
    setSuccess(""); setError("");
    try {
      const res = await fetch(`${API_BASE}/users/updateProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: pending, displayName, bio, location }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelected(pending);
        localStorage.setItem("avatar", pending);
        setSuccess("Profile updated");
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.contentTitle}>Profile Photo</h2>
      <p className={styles.contentDescription}>Choose a photo to represent your account.</p>
      <hr className={styles.contentDivider} />

      {/* Current avatar preview */}
      <p className={styles.fieldLabel}>Current photo</p>
      <img src={selected} alt="Current avatar" className={styles.avatarPreview} />

      {/* Avatar grid */}
      <p className={styles.fieldLabel}>Choose a new photo</p>
      <div className={styles.avatarGrid}>
        {PRESET_AVATARS.map((src) => (
          <img
            key={src}
            src={src}
            alt="Avatar option"
            onClick={() => setPending(src)}
            className={`${styles.avatarOption} ${pending === src ? styles.avatarSelected : ""}`}
          />
        ))}
      </div>

      <p className={styles.fieldLabel}>Display name</p>
<input
  type="text"
  placeholder="Your display name"
  value={displayName}
  onChange={(e) => setDisplayName(e.target.value)}
  className={styles.input}
/>

<p className={styles.fieldLabel}>Bio</p>
<textarea
  placeholder="Tell us a little about yourself"
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  className={styles.input}
  rows={3}
  maxLength={200}
  style={{ resize: "vertical" }}
/>
<p style={{ fontSize: "12px", color: bio.length > 180 ? "#ef4444" : "#6b7280", textAlign: "right" }}>
  {bio.length}/200
</p>

<p className={styles.fieldLabel}>Location</p>
<input
  type="text"
  placeholder="City, Country"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  className={styles.input}
/>

      {success && <p className={styles.success}>{success}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.button}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
      <p className={styles.attribution}>
  Avatars: <a href="https://www.dicebear.com/styles/fun-emoji/" target="_blank" rel="noopener noreferrer">Fun Emoji</a> style,
  a remix of <a href="https://www.figma.com/@davisuche" target="_blank" rel="noopener noreferrer">Fun Emoji Set by Davis Uche</a>,
  licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.
</p>
    </div>
  );
}

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
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Please enter a valid email address";
}


function EmailSection() {
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const [currentEmail, setCurrentEmail] = useState("Loading...");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCurrentEmail(data.email);
      } catch {
        console.error("Failed to fetch user info");
      }
    };
    fetchUserInfo();
  }, []);

  async function handleEmailChange() {
    if (!newEmail.trim()) { setEmailError("Email cannot be empty."); return; }

    const validationError = validateEmail(newEmail);
    if (validationError) { setEmailError(validationError); return; }

    setLoading(true);
    setEmailError("");
    setEmailSuccess("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/emailChange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailSuccess("Email updated successfully.");
        setNewEmail("");
        setCurrentEmail(newEmail);
      } else {
        setEmailError(data.message || "Failed to update email.");
      }
    } catch {
      setEmailError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.contentTitle}>Change Email</h2>
      <p className={styles.contentDescription}>Update the email address associated with your account.</p>
      <hr className={styles.contentDivider} />
      <p className={styles.fieldLabel}>Current email</p>
      <p style={{ fontSize: "14px", color: "#374151", marginBottom: "20px" }}>{currentEmail}</p>
      <p className={styles.fieldLabel}>New email</p>
      <input
        type="email"
        placeholder="New email address"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        onFocus={() => { setEmailError(""); setEmailSuccess(""); }}
        disabled={loading}
        className={styles.input + (emailError ? " " + styles.inputError : "")}
      />
      {emailError && <p className={styles.error}>{emailError}</p>}
      {emailSuccess && <p className={styles.success}>{emailSuccess}</p>}
      <button className={styles.button} onClick={handleEmailChange} disabled={loading}>
        {loading ? "Saving..." : "Save Email"}
      </button>
    </div>
  );
}

function TwoFactorSection() {
  const [enabled, setEnabled] = useState(
    localStorage.getItem("twoFactorEnabled") === "true"
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  async function handleToggle() {
    setLoading(true);
    setStatusMessage("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/users/toggle2FA`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEnabled(data.twoFactorEnabled);
        localStorage.setItem("twoFactorEnabled", data.twoFactorEnabled);
        setStatusMessage(data.message);
      } else {
        setError(data.message || "Failed to update 2FA.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.contentTitle}>Two-Factor Authentication</h2>
      <p className={styles.contentDescription}>
        Add an extra layer of security by requiring an email verification code at login.
      </p>
      <hr className={styles.contentDivider} />
      <p className={styles.fieldLabel}>
        2FA is currently <strong>{enabled ? "enabled" : "disabled"}</strong>
      </p>
      {statusMessage && <p className={styles.success}>{statusMessage}</p>}
      {error && <p className={styles.error}>{error}</p>}
      <button
        className={enabled ? styles.buttonDanger : styles.button}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? "Saving..." : enabled ? "Disable 2FA" : "Enable 2FA"}
      </button>
    </div>
  );
}

function NotificationSection() {
  const [settings, setSettings] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE}/users/notification-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setSettings(data);
        else setError("Failed to load notification settings.");
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setLoading(true);
    setStatusMessage("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/users/notification-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setStatusMessage("Notification settings saved.");
      } else {
        setError(data.message || "Failed to save settings.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className={styles.contentTitle}>Notification Settings</h2>
      <p className={styles.contentDescription}>
        Configure when you receive daily task reminder emails. Reminders include
        any incomplete tasks due within your selected window, as well as any
        overdue tasks.
      </p>
      <hr className={styles.contentDivider} />
      {statusMessage && <p className={styles.success}>{statusMessage}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.fieldLabel}>Email reminders</p>
      <select
        className={styles.input}
        value={settings.remindersEnabled}
        onChange={(e) => setSettings({ ...settings, remindersEnabled: e.target.value === "true" })}
      >
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>

      <p className={styles.fieldLabel}>Remind me about tasks due within</p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="number"
          className={styles.input}
          value={settings.reminderDaysBefore}
          min={1}
          max={30}
          disabled={!settings.remindersEnabled}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 30) {
              setSettings({ ...settings, reminderDaysBefore: value });
            }
          }}
          style={{ width: "80px" }}
        />
        <span style={{ color: "#475569", fontSize: "14px" }}>days</span>
      </div>
      {settings.reminderDaysBefore > 14 && settings.remindersEnabled && (
        <p style={{ color: "#f59e0b", fontSize: "13px", marginTop: "4px" }}>
          Note: setting a large window may result in many tasks being included in each reminder.
        </p>
      )}

      <hr className={styles.contentDivider} />
<p className={styles.fieldLabel}>Weekly analytics report</p>
<select
  className={styles.input}
  value={settings.analyticsReportEnabled}
  onChange={(e) => setSettings({ ...settings, analyticsReportEnabled: e.target.value === "true" })}
>
  <option value="true">Enabled</option>
  <option value="false">Disabled</option>
</select>

      <button
        className={styles.button}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

function GoogleSection() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserInfo = async () => {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setIsConnected(!!data.googleCalendarConnected);
      setLoading(false);
    };
    fetchUserInfo();
  }, []);

  async function handleDisconnect() {
    setLoading(true);
    await fetch(`${API_BASE}/users/google/disconnect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    setIsConnected(false);
    setLoading(false);
  }

  if (loading) return <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading...</p>;

  return (
    <div>
      <h2 className={styles.contentTitle}>Google Calendar</h2>
      <p className={styles.contentDescription}>
        Sync your events with Google Calendar.
      </p>
      <hr className={styles.contentDivider} />
      {isConnected ? (
        <>
          <p className={styles.success} style={{ marginBottom: "16px" }}>
            ✓ Google Calendar connected — events will sync automatically.
          </p>
          <button className={styles.buttonDanger} onClick={handleDisconnect} disabled={loading}>
            Disconnect Google Calendar
          </button>
        </>
      ) : (
        <a href={`${API_BASE}/auth/google`}>
          <button className={styles.button}>Connect Google Calendar</button>
        </a>
      )}
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
          window.dispatchEvent(new Event("auth-changed"));
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
  const [activeSection, setActiveSection] = useState(SECTIONS.PROFILE);
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
  className={`${styles.sidebarItem} ${activeSection === SECTIONS.PROFILE ? styles.sidebarItemActive : ""}`}
  onClick={() => setActiveSection(SECTIONS.PROFILE)}
>
  Profile
</button>

        <button
          className={`${styles.sidebarItem} ${activeSection === SECTIONS.USERNAME ? styles.sidebarItemActive : ""}`}
          onClick={() => setActiveSection(SECTIONS.USERNAME)}
        >
          Change Username
        </button>

        {/* Email change */}
        <button
          className={`${styles.sidebarItem} ${activeSection === SECTIONS.EMAIL ? styles.sidebarItemActive : ""}`}
          onClick={() => setActiveSection(SECTIONS.EMAIL)}
        >
          Change Email
        </button>

        <button
  className={`${styles.sidebarItem} ${activeSection === SECTIONS.PRIVACY ? styles.sidebarItemActive : ""}`}
  onClick={() => setActiveSection(SECTIONS.PRIVACY)}
>
  Privacy
</button>

        {/* Toggle 2FA */}
        <button
          className={`${styles.sidebarItem} ${activeSection === SECTIONS.TWO_FACTOR ? styles.sidebarItemActive : ""}`}
          onClick={() => setActiveSection(SECTIONS.TWO_FACTOR)}
        >
          Two-Factor Authentication
        </button>

        <button
  className={`${styles.sidebarItem} ${activeSection === SECTIONS.GOOGLE ? styles.sidebarItemActive : ""}`}
  onClick={() => setActiveSection(SECTIONS.GOOGLE)}
>
  Google Account
</button>

        {/* Notification Settings */}
        <button
          className={`${styles.sidebarItem} ${activeSection === SECTIONS.NOTIFICATION ? styles.sidebarItemActive : ""}`}
          onClick={() => setActiveSection(SECTIONS.NOTIFICATION)}
        >
          Notification Settings
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
        {activeSection === SECTIONS.PROFILE && <ProfileSection />}
        {activeSection === SECTIONS.USERNAME && (
          <UsernameSection oldUsername={oldUsername} setOldUsername={setOldUsername} />
        )}
        {activeSection === SECTIONS.EMAIL && <EmailSection />}
        {activeSection === SECTIONS.TWO_FACTOR && <TwoFactorSection />}
        {activeSection === SECTIONS.PRIVACY && <PrivacySection />}
        {activeSection === SECTIONS.GOOGLE && <GoogleSection />}
        {activeSection === SECTIONS.NOTIFICATION && <NotificationSection />}
        {activeSection === SECTIONS.DELETE && (
          <DeleteSection />
        )}
      </div>

    </div>
  );
}
