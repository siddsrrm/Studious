import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ACHIEVEMENTS } from "../../achievements"
import styles from "./AchievementsPage.module.css"

function AchievementsPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const myUsername = localStorage.getItem("username")
  const [earned, setEarned] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/achievements`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setEarned(data)
        }
      } catch {}
      setIsLoading(false)
    }
    load()
  }, [token])

  const earnedMap = {}
  earned.forEach(e => { earnedMap[e.achievementId] = e.earnedAt })

  const unlockedCount = ACHIEVEMENTS.filter(a => earnedMap[a.id]).length

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.content}>
        <h2 className={styles.contentTitle}>Achievements</h2>
        <p className={styles.contentDescription}>
          {isLoading ? "Loading..." : `${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
        </p>
        <hr className={styles.contentDivider} />

        <div className={styles.grid}>
          {ACHIEVEMENTS.map(achievement => {
            const earnedAt = earnedMap[achievement.id]
            const unlocked = !!earnedAt
            return (
              <div
                key={achievement.id}
                className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked}`}
              >
                <div className={styles.tooltip}>
                  <div className={styles.tooltipTitle}>{achievement.name}</div>
                  <div className={styles.tooltipDescription}>{achievement.description}</div>
                  {unlocked && (
                    <div className={styles.tooltipDate}>
                      Unlocked {new Date(earnedAt).toLocaleDateString()}
                    </div>
                  )}
                  {!unlocked && (
                    <div className={styles.tooltipLocked}>Not yet unlocked</div>
                  )}
                </div>
                <img
                  src={`/badges/${achievement.badge}`}
                  alt={achievement.name}
                  className={styles.badgeImage}
                />
                <p className={styles.badgeName}>{achievement.name}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AchievementsPage
