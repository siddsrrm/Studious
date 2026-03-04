import { Link, useNavigate } from 'react-router-dom'
import styles from './Login.module.css'
import { useState } from 'react'

function Login() {
  const navigate = useNavigate()

  // set all default values to empty
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [usernameError, setUsernameError] = useState("")
  const [passwordError, setPasswordError] = useState("")

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

  const handleSubmit = async () => {
    handleUsernameBlur()
    handlePasswordBlur()

    if (username === "" || password === "") {
      return
    } else if (password.length < 8) {
      return
    }

    // check if email was entered
    const isEmail = username.includes("@")

    const body = isEmail ? { email: username, password } : { username, password }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    console.log(data)

    if (!response.ok) {
      setError(data.message)
    } else {
      localStorage.setItem("token", data.token)
      localStorage.setItem("username", data.username)
      navigate("/home")
    }
  }

  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      <input type="username" placeholder="Username or Email" className={styles.input + (usernameError ? " " + styles.inputError : "")} onChange={handleUsername} onBlur={handleUsernameBlur} onFocus={() => setUsernameError("")}/>
      {usernameError && <p className={styles.error}>{usernameError}</p>}

      <input type="password" placeholder="Password" className={styles.input + (passwordError ? " " + styles.inputError : "")} onChange={handlePassword} onBlur={handlePasswordBlur} onFocus={() => setPasswordError("")}/>
      {passwordError && <p className={styles.error}>{passwordError}</p>}

      <button onClick={handleSubmit} className={styles.button}>Login</button>
      <button onClick={() => navigate("/forgot-password")} className={styles.button}>Forgot Password</button>
      <p>Don't have an account? <Link to="/register">Register</Link></p>


      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

export default Login