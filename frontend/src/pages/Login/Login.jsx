import { Link } from 'react-router-dom'
import styles from './Login.module.css'
import { useState } from 'react'

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [usernameError, setUsernameError] = useState("")
  const [passwordError, setPasswordError] = useState("")

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
    handleUsernameBlur()
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
      <input type="username" placeholder="Username" className={styles.input + (usernameError ? " " + styles.inputError : "")} onChange={handleUsername} onBlur={handleUsernameBlur} onFocus={() => setUsernameError("")}/>
      {usernameError && <p className={styles.error}>{usernameError}</p>}

      <input type="password" placeholder="Password" className={styles.input + (passwordError ? " " + styles.inputError : "")} onChange={handlePassword} onBlur={handlePasswordBlur} onFocus={() => setPasswordError("")}/>
      {passwordError && <p className={styles.error}>{passwordError}</p>}

      <button onClick={handleSubmit} className={styles.button}>Login</button>
      <p>Don't have an account? <Link to="/Register">Register</Link></p>
    </div>
  )
}

export default Login