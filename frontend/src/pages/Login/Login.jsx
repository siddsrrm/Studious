import { Link } from 'react-router-dom'
import styles from './Login.module.css'
import { useState } from 'react'

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleEmail = (e) => {
    setEmail(e.target.value)
  }

  const handleEmailBlur = () => {
    if (email === "") {
      setEmailError("Email is required")
    } else if (!email.includes("@") || !email.includes(".")) {
      setEmailError("Email is invalid")
    } else {
      setEmailError("")
    }
  }
  
  const handlePassword = (e) => {
    setPassword(e.target.value)
  }

  const handlePasswordBlur = () => {
    if (password === "") {
      setPasswordError("Password is required")
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters")
    } else {
      setPasswordError("")
    }
  }

  const handleSubmit = (e) => {
    handleEmailBlur()
    handlePasswordBlur()

    if (email === "" || password === "") {
      return
    } else if (!email.includes("@") || !email.includes(".")) {
      return
    } else if (password.length < 8 || confirmPassword.length < 8) {
      return
    }


  }

  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      <input type="email" placeholder="Email" className={styles.input + (emailError ? " " + styles.inputError : "")} onChange={handleEmail} onBlur={handleEmailBlur} onFocus={() => setEmailError("")}/>
      {emailError && <p className={styles.error}>{emailError}</p>}

      <input type="password" placeholder="Password" className={styles.input + (passwordError ? " " + styles.inputError : "")} onChange={handlePassword} onBlur={handlePasswordBlur} onFocus={() => setPasswordError("")}/>
      {passwordError && <p className={styles.error}>{passwordError}</p>}

      <button onClick={handleSubmit} className={styles.button}>Login</button>
      <p>Don't have an account? <Link to="/Register">Register</Link></p>
    </div>
  )
}

export default Login