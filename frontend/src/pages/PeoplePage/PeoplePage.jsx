import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./PeoplePage.module.css"

function PeoplePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [sentIds, setSentIds] = useState(new Set())
  const [friendIds, setFriendIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem("token")
  const myUsername = localStorage.getItem("username")

  useEffect(() => {
    const loadRelationships = async () => {
      const [friendsRes, sentRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/friendrequests/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/friendrequests/sent`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      const friends = await friendsRes.json()
      const sent = await sentRes.json()
      setFriendIds(new Set(friends.map(r =>
        r.sender.username === myUsername ? r.recipient._id : r.sender._id
      )))
      setSentIds(new Set(sent.map(r => r.recipient._id)))
    }
    loadRelationships()
  }, [])

  useEffect(() => {
    if (query.trim() === "") { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setResults(data)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const sendRequest = async (userId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipientId: userId })
    })
    if (res.ok) {
      setSentIds(prev => new Set([...prev, userId.toString()]))
    }
  }

  const getButtonState = (user) => {
    if (friendIds.has(user._id.toString())) return { label: "Friends", disabled: true }
    if (sentIds.has(user._id.toString())) return { label: "Requested", disabled: true }
    return { label: "Add Friend", disabled: false }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate("/home")}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.content}>
        <h2 className={styles.contentTitle}>Find People</h2>
        <p className={styles.contentDescription}>Search for other Studious users to add as friends.</p>
        <hr className={styles.contentDivider} />

        <p className={styles.fieldLabel}>Search by username</p>
        <input
          className={styles.input}
          type="text"
          placeholder="Enter a username..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {loading && <p className={styles.status}>Searching...</p>}
        {!loading && query && results.length === 0 && (
          <p className={styles.status}>No users found</p>
        )}

        <div className={styles.list}>
          {results.map(user => {
            const btn = getButtonState(user)
            return (
              <div key={user._id} className={styles.card}>
                <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
                <div className={styles.info}>
                  <p className={styles.username}>{user.username}</p>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.outlineButton}
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    View Profile
                  </button>
                  <button
                    className={btn.disabled ? styles.buttonDisabled : styles.button}
                    onClick={() => !btn.disabled && sendRequest(user._id)}
                    disabled={btn.disabled}
                  >
                    {btn.label}
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

export default PeoplePage