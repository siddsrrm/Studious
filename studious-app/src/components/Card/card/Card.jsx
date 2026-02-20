import styles from './Card.module.css'

function Card() {
  return (
    <div className = {styles.card}>
      <h2>Course</h2>
      <p>study plan</p>
    </div>
  );  
}

export default Card