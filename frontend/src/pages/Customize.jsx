import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


//Code to handle frontend of account name change
//NOTE: THIS PAGE DOES NOT VERIFY THE USER'S IDENTITY
// ANYONE CAN GO TO THE LINK OF A USERNAME THEY WANT TO CHANGE AND CHANGE IT
function ProfileSettings() {
  const navigate = useNavigate();

  const {username} = useParams(); // Get username from URL
  const [currentName] = useState(username); 
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
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



    // send request to backend to update name
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/nameChange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          newName: newName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("username", newName)
        window.location.href = `/settings/${newName}`;
      } else {
        setError("Error: " + (data.message || "Name Change failed"));
      }
    } catch (error) {
      setError("Error updating name: " + error.message);
      console.error("Update error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Profile Settings</h2>
          <button
            onClick={() => navigate("/home")}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#555" }}
          >
            &times;
          </button>
        </div>

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

        <button
          onClick={() => navigate(`/delete/${username}`)}
          style={{ ...styles.button, backgroundColor: "red", marginTop: "1rem" }}
        >
          Delete Account
        </button>
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
