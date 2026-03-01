import { Link, useNavigate } from 'react-router-dom'
import styles from './Register.module.css'
import { useState } from 'react'
import logo from '../../assets/studious-logo.png'

function Register() {
  const navigate = useNavigate()

  // set all default values to empty
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [usernameError, setUsernameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  // error for backend errors
  const [error, setError] = useState("")

  const handleUsername = (e) => {
    setUsername(e.target.value)
  }

  const handleUsernameBlur = () => {
    if (username === "") {
      setUsernameError("Username is required")
    } else {
      setUsernameError("")
    }
  }

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

  const handleConfirmPassword = (e) => {
    setConfirmPassword(e.target.value)
  }

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword === "") {
      setConfirmPasswordError("Confirm password is required")
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError("")
    }
  }

  const handleSubmit = async () => {
    handleUsernameBlur()
    handleEmailBlur()
    handlePasswordBlur()
    handleConfirmPasswordBlur()

    if (username === "" || email === "" ||
        password === "" || confirmPassword === "") {
      return
    } else if (!email.includes("@") || !email.includes(".")) {
      return
    } else if (password.length < 8 || confirmPassword.length < 8) {
      return
    } else if (password !== confirmPassword) {
      return
    }

    // validation passed, send post request to backend
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message)
      } else {
        navigate("/login")  
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  return (
    <div className={styles.container}>
      <img src={logo} alt="Studious logo" width="325"/>
      <input type="text" placeholder="Username" className={styles.input + (usernameError ? " " + styles.inputError : "")} onChange={handleUsername} onBlur={handleUsernameBlur} onFocus={() => setUsernameError("")}/>
      {usernameError && <p className={styles.error}>{usernameError}</p>}

      <input type="email" placeholder="Email" className={styles.input + (emailError ? " " + styles.inputError : "")} onChange={handleEmail} onBlur={handleEmailBlur} onFocus={() => setEmailError("")}/>
      {emailError && <p className={styles.error}>{emailError}</p>}

      <input type="password" placeholder="Password" className={styles.input + (passwordError ? " " + styles.inputError : "")} onChange={handlePassword} onBlur={handlePasswordBlur} onFocus={() => setPasswordError("")}/>
      {passwordError && <p className={styles.error}>{passwordError}</p>}

      <input type="password" placeholder="Confirm Password" className={styles.input + (confirmPasswordError ? " " + styles.inputError : "")} onChange={handleConfirmPassword} onBlur={handleConfirmPasswordBlur} onFocus={() => setConfirmPasswordError("")}/>
      {confirmPasswordError && <p className={styles.error}>{confirmPasswordError}</p>}

      <button onClick={handleSubmit} className={styles.button}>Register</button>
      <p>Already have an account? <Link to="/login">Login</Link></p>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

export default Register