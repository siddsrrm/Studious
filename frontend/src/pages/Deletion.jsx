import React, { useState } from "react";
import { useParams } from "react-router-dom";

function DeleteAccount() {
  const { username } = useParams();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!password) {
      alert("Please enter your password to confirm.");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );

    if (!confirmed) {
      // User clicked "Cancel"
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account deleted successfully!");
        window.location.href = "/";
      } else {
        alert("Error: " + (data.message || "Account deletion failed"));
      }
    } catch (error) {
      alert("Error deleting account: " + error.message);
      console.error("Delete error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Delete Account</h2>
        <p style={styles.accountInfo}>
          Account: <strong>{username}</strong>
        </p>

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

          <div style={styles.buttonGroup}>
            <button
              type="submit"
    
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
  accountInfo: {
    marginBottom: "1rem",
    fontSize: "0.95rem",
    color: "#f1d2d2",
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
