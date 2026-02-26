import { Link } from 'react-router-dom'
import styles from './Register.module.css'
import { useState } from 'react'

function Register() {
  // set all default values to empty
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [firstNameError, setFirstNameError] = useState("")
  const [lastNameError, setLastNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  const handleFirstName = (e) => {
    setFirstName(e.target.value)
  }

  const handleFirstNameBlur = () => {
    if (firstName === "") {
      setFirstNameError("First name is required")
    } else {
      setFirstNameError("")
    }
  }

  const handleLastName = (e) => {
    setLastName(e.target.value)
  }

  const handleLastNameBlur = () => {
    if (lastName === "") {
      setLastNameError("Last name is required")
    } else {
      setLastNameError("")
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

  const handleSubmit = (e) => {
    handleFirstNameBlur()
    handleLastNameBlur()
    handleEmailBlur()
    handlePasswordBlur()
    handleConfirmPasswordBlur()

    if (firstName === "" || lastName === "" || email === "" ||
        password === "" || confirmPassword === "") {
      return
    } else if (!email.includes("@") || !email.includes(".")) {
      return
    } else if (password.length < 8 || confirmPassword.length < 8) {
      return
    } else if (password !== confirmPassword) {
      return
    }

    // validation passed, send to backend
  }

  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      <input type="text" placeholder="First Name" className={styles.input + (firstNameError ? " " + styles.inputError : "")} onChange={handleFirstName} onBlur={handleFirstNameBlur} onFocus={() => setFirstNameError("")}/>
      {firstNameError && <p className={styles.error}>{firstNameError}</p>}

      <input type="text" placeholder="Last Name" className={styles.input + (lastNameError ? " " + styles.inputError : "")} onChange={handleLastName} onBlur={handleLastNameBlur} onFocus={() => setLastNameError("")}/>
      {lastNameError && <p className={styles.error}>{lastNameError}</p>}

      <input type="email" placeholder="Email" className={styles.input + (emailError ? " " + styles.inputError : "")} onChange={handleEmail} onBlur={handleEmailBlur} onFocus={() => setEmailError("")}/>
      {emailError && <p className={styles.error}>{emailError}</p>}

      <input type="password" placeholder="Password" className={styles.input + (passwordError ? " " + styles.inputError : "")} onChange={handlePassword} onBlur={handlePasswordBlur} onFocus={() => setPasswordError("")}/>
      {passwordError && <p className={styles.error}>{passwordError}</p>}

      <input type="password" placeholder="Confirm Password" className={styles.input + (confirmPasswordError ? " " + styles.inputError : "")} onChange={handleConfirmPassword} onBlur={handleConfirmPasswordBlur} onFocus={() => setConfirmPasswordError("")}/>
      {confirmPasswordError && <p className={styles.error}>{confirmPasswordError}</p>}

      <button onClick={handleSubmit} className={styles.button}>Register</button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

export default Register