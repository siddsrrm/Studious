import React, { useState } from "react";

function ProfileSettings() {
  const [currentName] = useState("Aaron Carter"); // Replace with fetched user data
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newName.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }

    if (newName === currentName) {
      setError("New name must be different from current name.");
      return;
    }

    // TODO: Connect to backend API
    console.log("Updating name to:", newName);

    setSuccess("Name updated successfully!");
    setNewName("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Profile Settings</h2>

        <p style={styles.currentName}>
          Current Name: <strong>{currentName}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>New Display Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new name"
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}

          <button type="submit" style={styles.button}>
            Update Name
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f6f8",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    width: "400px",
  },
  currentName: {
    marginBottom: "1rem",
    color: "#555",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.6rem",
    marginBottom: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "0.7rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: "0.5rem",
  },
  success: {
    color: "green",
    marginBottom: "0.5rem",
  },
};

export default ProfileSettings;
