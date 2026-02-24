import React, { useState } from "react";

function DeleteAccount() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();

    if (!confirmed) {
      alert("Please confirm account deletion.");
      return;
    }

    // TODO: connect to backend delete API
    console.log("Deleting account...");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Delete Account</h2>

        <p style={styles.warning}>
          This action is permanent and cannot be undone.
          All your data will be permanently deleted.
        </p>

        <form onSubmit={handleDelete}>
          <label style={styles.label}>
            Confirm your password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="confirmDelete"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirmDelete">
              I understand this action cannot be undone.
            </label>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={!confirmed || !password}
              style={styles.deleteButton}
            >
              Permanently Delete Account
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
          </div>
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
    backgroundColor: "#ec1d1d",
  },
  card: {
    backgroundColor: "#751c1c",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    width: "400px",
  },
  title: {
    marginBottom: "1rem",
  },
  warning: {
    color: "red",
    marginBottom: "1.5rem",
    fontWeight: "bold",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "1rem",
  },
  checkboxContainer: {
    marginBottom: "1rem",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: "0.5rem 1rem",
    border: "none",
    cursor: "pointer",
  },
};

export default DeleteAccount;
