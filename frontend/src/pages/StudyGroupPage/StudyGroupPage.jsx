import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./StudyGroupPage.module.css"

function StudyGroupPage() {
  const navigate = useNavigate()
  const myUsername = localStorage.getItem("username")
  const myUserId = localStorage.getItem("userId")
  const token = localStorage.getItem("token")

  const [query, setQuery] = useState("")
  const [allGroups, setAllGroups] = useState([])
  const [myGroupIds, setMyGroupIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [allRes, myRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/studygroups/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/studygroups`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      if (allRes.ok) setAllGroups(await allRes.json())
      if (myRes.ok) {
        const mine = await myRes.json()
        setMyGroupIds(new Set(mine.map(g => g._id)))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = allGroups.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate("/home")}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div>
            <h2 className={styles.contentTitle}>Find Groups</h2>
            <p className={styles.contentDescription}>Search for study groups to join.</p>
          </div>
        </div>
        <hr className={styles.contentDivider} />

        <div className={styles.searchWrapper}>
          <input
            className={styles.input}
            type="text"
            placeholder="Search groups..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {loading && <p className={styles.status}>Loading...</p>}
        {!loading && filtered.length === 0 && (
          <p className={styles.status}>
            {query ? "No groups found." : "No groups exist yet."}
          </p>
        )}

        <div className={styles.grid}>
          {filtered.map(group => {
            const isMember = myGroupIds.has(group._id)
            return (
              <div key={group._id} className={styles.card}>
                <div className={styles.groupAvatar}>
                  {group.name[0].toUpperCase()}
                </div>
                <p className={styles.groupName}>{group.name}</p>
                <p className={styles.groupMeta}>{group.members?.length ?? 0} members</p>
                {isMember && <span className={styles.memberBadge}>Member</span>}
                <div className={styles.actions}>
                  <button
                    className={styles.openButton}
                    onClick={() => navigate(`/studygroups/${group._id}`)}
                  >
                    {isMember ? "Open" : "View"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StudyGroupPage
