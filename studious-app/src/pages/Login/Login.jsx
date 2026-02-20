import styles from './Login.module.css'

function Login() {
  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      <input type="email" placeholder="Email" className={styles.input} />
      <input type="password" placeholder="Password" className={styles.input} />
      <button className={styles.button}>Login</button>
      <p>Don't have an account? <a href="/register">Register</a></p>
    </div>
  )
}

export default Login