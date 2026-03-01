import { useState } from "react";
import styles from "./ForgotPassword.module.css";
import logo from '../../assets/studious-logo.png'

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendLink = async () => {
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("If an account exists for this email, a reset link has been sent.");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className={styles.container}>
      <img src={logo} alt="Studious logo" width="325"/>

      <p className={styles.description}>
        Enter your email and we’ll send you a link to reset your password.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <input
        type="email"
        placeholder="Email"
        className={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button className={styles.button} onClick={handleSendLink}>
        Send Reset Link
      </button>

      <p>
        Remember your password? <a href="/login">Login</a>
      </p>
    </div>
  );
}

export default ForgotPassword;