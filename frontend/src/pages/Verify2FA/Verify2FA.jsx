import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Verify2FA.module.css";

function Verify2FA() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleVerify = async () => {
    setError("");
    setMessage("");

    if (!code) {
      setError("Please enter the verification code.");
      return;
    }

    if (code.length !== 6) {
      setError("Code must be 6 digits.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-2fa`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage("Verification successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500); //change later
      } else {
        setError(data.message || "Invalid or expired code.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Studious</h1>

      <p className={styles.description}>
        Enter the 6-digit verification code sent to your email.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <input
        type="text"
        placeholder="Enter 6-digit code"
        className={styles.input}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
      />

      <button className={styles.button} onClick={handleVerify}>
        Verify
      </button>

      {/* <p>
        Didn’t receive a code? <a href="/resend-2fa">Resend</a>
      </p> */}

      <p>
        Back to <a href="/login">Login</a>
      </p>
    </div>
  );
}

export default Verify2FA;