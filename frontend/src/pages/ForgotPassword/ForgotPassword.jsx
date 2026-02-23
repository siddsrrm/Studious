import styles from './ForgotPassword.module.css'

function ForgotPassword() {
  return (
    <div className={styles.container}>
      <h1>Studious</h1>
      
      <p className={styles.description}>
        Enter your email and we’ll send you a link to reset your password.
      </p>

      <input
        type="email"
        placeholder="Email"
        className={styles.input}
      />

      <button className={styles.button}>
        Send Reset Link
      </button>

      <p>
        Remember your password? <a href="/login">Login</a>
      </p>
    </div>
  )
}

export default ForgotPassword