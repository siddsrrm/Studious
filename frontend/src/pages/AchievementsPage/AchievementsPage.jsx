import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./AchievementsPage.module.css"

function AchievementsPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const myUsername = localStorage.getItem("username")
  const [achievements, setAchievements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [defsRes, earnedRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/achievements/definitions`),
          fetch(`${import.meta.env.VITE_API_URL}/achievements`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        const defs = defsRes.ok ? await defsRes.json() : []
        const earned = earnedRes.ok ? await earnedRes.json() : []
        const earnedMap = {}
        earned.forEach(e => { earnedMap[e.achievementId] = e.earnedAt })
        setAchievements(defs.map(def => ({
          ...def,
          unlocked: !!earnedMap[def.id],
          earnedAt: earnedMap[def.id] || null
        })))
      } catch {}
      setIsLoading(false)
    }
    load()
  }, [token])

  const unlockedCount = achievements.filter(a => a.unlocked).length

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
          {isLoading ? "Loading..." : `${unlockedCount} of ${achievements.length} unlocked`}
        </p>
        <hr className={styles.contentDivider} />

        <div className={styles.grid}>
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`${styles.badge} ${achievement.unlocked ? styles.unlocked : styles.locked}`}
            >
              <div className={styles.tooltip}>
                <div className={styles.tooltipTitle}>{achievement.name}</div>
                <div className={styles.tooltipDescription}>{achievement.description}</div>
                {achievement.unlocked
                  ? <div className={styles.tooltipDate}>Unlocked {new Date(achievement.earnedAt).toLocaleDateString()}</div>
                  : <div className={styles.tooltipLocked}>Not yet unlocked</div>
                }
              </div>
              <img
                src={`/badges/${achievement.badge}`}
                alt={achievement.name}
                className={styles.badgeImage}
              />
              <p className={styles.badgeName}>{achievement.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AchievementsPage
