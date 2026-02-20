import styles from './Register.module.css'

function Register() {
  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      <input type="text" placeholder="First Name" className={styles.input} />
      <input type="text" placeholder="Last Name" className={styles.input} />
      <input type="email" placeholder="Email" className={styles.input} />
      <input type="password" placeholder="Password" className={styles.input} />
      <input type="password" placeholder="Confirm Password" className={styles.input} />
      <button className={styles.button}>Register</button>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  )
}

export default Register