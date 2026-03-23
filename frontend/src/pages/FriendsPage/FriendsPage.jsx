import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./FriendsPage.module.css"

const TABS = ["Friends", "Pending", "Sent"]

function FriendsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("Friends")
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [sent, setSent] = useState([])
  const token = localStorage.getItem("token")
  const myUsername = localStorage.getItem("username")

  const load = async () => {
    const headers = { Authorization: `Bearer ${token}` }
    const [fRes, pRes, sRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/friendrequests/friends`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/friendrequests/pending`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/friendrequests/sent`, { headers })
    ])
    setFriends(await fRes.json())
    setPending(await pRes.json())
    setSent(await sRes.json())
  }

  useEffect(() => {
    load()
  }, [])

  const respond = async (requestId, status, isAccept) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    if (res.ok) load()
  }

  const cancel = async (requestId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) load()
  }

  const getFriendUser = (request) =>
    request.sender.username === myUsername ? request.recipient : request.sender

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate("/home")}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.content}>
        <h2 className={styles.contentTitle}>Friends</h2>
        <p className={styles.contentDescription}>Manage your friends and requests.</p>
        <hr className={styles.contentDivider} />

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.activeTab : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === "Pending" && pending.length > 0 && (
                <span className={styles.badge}>{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {tab === "Friends" && (
            friends.length === 0
              ? <p className={styles.empty}>No friends yet. Find people to add!</p>
              : friends.map(r => {
                  const user = getFriendUser(r)
                  return (
                    <div key={r._id} className={styles.card}>
                      <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
                      <div className={styles.info}>
                        <p className={styles.username}>{user.username}</p>
                      </div>
                      <button className={styles.outlineButton} onClick={() => navigate(`/profile/${user._id}`)}>
                        View Profile
                      </button>
                    </div>
                  )
                })
          )}

          {tab === "Pending" && (
            pending.length === 0
              ? <p className={styles.empty}>No pending requests</p>
              : pending.map(r => (
                  <div key={r._id} className={styles.card}>
                    <div className={styles.avatar}>{r.sender.username[0].toUpperCase()}</div>
                    <div className={styles.info}>
                      <p className={styles.username}>{r.sender.username}</p>
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.acceptButton} onClick={() => respond(r._id, 1, true)}>Accept</button>
                      <button className={styles.declineButton} onClick={() => respond(r._id, 2, false)}>Decline</button>
                    </div>
                  </div>
                ))
          )}

          {tab === "Sent" && (
            sent.length === 0
              ? <p className={styles.empty}>No sent requests</p>
              : sent.map(r => (
                  <div key={r._id} className={styles.card}>
                    <div className={styles.avatar}>{r.recipient.username[0].toUpperCase()}</div>
                    <div className={styles.info}>
                      <p className={styles.username}>{r.recipient.username}</p>
                    </div>
                    <button className={styles.cancelButton} onClick={() => cancel(r._id)}>Cancel</button>
                  </div>
                ))
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendsPage