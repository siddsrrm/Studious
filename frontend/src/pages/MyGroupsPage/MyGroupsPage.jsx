import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./MyGroupsPage.module.css"

function MyGroupsPage() {
  const navigate = useNavigate()
  const myUsername = localStorage.getItem("username")
  const token = localStorage.getItem("token")

  const [groups, setGroups] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const loadGroups = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    setGroups(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newGroupName.trim() })
    })

    if (res.ok) {
      const group = await res.json()
      setGroups(prev => [...prev, group])
      setNewGroupName("")
      setShowCreateModal(false)
    }
  }

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
            <h2 className={styles.contentTitle}>My Groups</h2>
            <p className={styles.contentDescription}>Groups you are a member of.</p>
          </div>
          {groups.length > 0 && (
            <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
              + Create Group
            </button>
          )}
        </div>
        <hr className={styles.contentDivider} />

        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>You haven't joined any groups yet.</p>
            <div className={styles.emptyActions}>
              <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
                + Create a Group
              </button>
              <button className={styles.findButton} onClick={() => navigate("/studygroups")}>
                Find Groups
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {groups.map(group => (
              <div key={group._id} className={styles.card} onClick={() => navigate(`/studygroups/${group._id}`)}>
                <div className={styles.groupAvatar}>
                  {group.name[0].toUpperCase()}
                </div>
                <p className={styles.groupName}>{group.name}</p>
                <p className={styles.groupMeta}>{group.members?.length ?? 0} members</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className={styles.overlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create Study Group</h3>
              <button className={styles.modalClose} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>Group name</label>
              <input
                className={styles.modalInput}
                type="text"
                placeholder="e.g. CS101 Study Group"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createGroup()}
              />
              <button className={styles.modalSubmit} onClick={createGroup}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyGroupsPage
