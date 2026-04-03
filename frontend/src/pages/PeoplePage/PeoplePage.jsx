import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { getSocket } from "../../socket"
import styles from "./PeoplePage.module.css"

const PAGE_SIZE = 30

function PeoplePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [friendIds, setFriendIds] = useState(new Set())
  const [sentRequests, setSentRequests] = useState({}) // { recipientId: requestId }
  const friendRequestsRef = useRef({})              // { userId: requestId } — ref avoids stale closures
  const [loading, setLoading] = useState(false)
  const [localToast, setLocalToast] = useState(null)
  const [localToastVisible, setLocalToastVisible] = useState(false)
  const toastTimers = useRef([])
  const token = localStorage.getItem("token")
  const myUsername = localStorage.getItem("username")

  function showLocalToast(message) {
    toastTimers.current.forEach(clearTimeout)
    setLocalToast(message)
    setLocalToastVisible(true)
    toastTimers.current = [
      setTimeout(() => setLocalToastVisible(false), 2500),
      setTimeout(() => setLocalToast(null), 3500)
    ]
  }

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
      const friendMap = {}
      friends.forEach(r => {
        const otherId = r.sender.username === myUsername ? r.recipient._id.toString() : r.sender._id.toString()
        friendMap[otherId] = r._id
      })
      friendRequestsRef.current = friendMap
      setFriendIds(new Set(Object.keys(friendMap)))
      const sentMap = {}
      sent.forEach(r => { sentMap[r.recipient._id.toString()] = r._id })
      setSentRequests(sentMap)
    }
    loadRelationships()

    const socket = getSocket()
    if (!socket) return

    const onRequestAccepted = (request) => {
      const friendId = request.recipient._id.toString()
      friendRequestsRef.current = { ...friendRequestsRef.current, [friendId]: request._id }
      setFriendIds(prev => new Set([...prev, friendId]))
      setSentRequests(prev => {
        const next = { ...prev }
        delete next[friendId]
        return next
      })
    }

    const onUnfriended = ({ requestId }) => {
      const entry = Object.entries(friendRequestsRef.current).find(([, rId]) => rId === requestId)
      if (!entry) return
      const next = { ...friendRequestsRef.current }
      delete next[entry[0]]
      friendRequestsRef.current = next
      setFriendIds(prev => {
        const updated = new Set(prev)
        updated.delete(entry[0])
        return updated
      })
    }

    const clearSentRequestById = (requestId) => {
      setSentRequests(prev => {
        const entry = Object.entries(prev).find(([, rId]) => rId === requestId)
        if (!entry) return prev
        const next = { ...prev }
        delete next[entry[0]]
        return next
      })
    }

    const onRequestDeclined = ({ requestId }) => {
      clearSentRequestById(requestId)
    }

    const onRequestCancelled = ({ requestId }) => {
      clearSentRequestById(requestId)
    }

    const onUserProfileUpdated = ({ userId, username, avatar }) => {
      if (!userId) return
      setResults(prev => prev.map(user => {
        if (user._id.toString() !== userId.toString()) return user
        return {
          ...user,
          username: username ?? user.username,
          avatar: avatar ?? user.avatar
        }
      }))
    }

    socket.on("friend_request_accepted", onRequestAccepted)
    socket.on("friend_request_declined", onRequestDeclined)
    socket.on("friend_request_cancelled", onRequestCancelled)
    socket.on("unfriended", onUnfriended)
    socket.on("user_profile_updated", onUserProfileUpdated)
    return () => {
      socket.off("friend_request_accepted", onRequestAccepted)
      socket.off("friend_request_declined", onRequestDeclined)
      socket.off("friend_request_cancelled", onRequestCancelled)
      socket.off("unfriended", onUnfriended)
      socket.off("user_profile_updated", onUserProfileUpdated)
    }
  }, [])

  useEffect(() => {
    if (query.trim() === "") { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/search?q=${query}&limit=${PAGE_SIZE}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setResults(data)
      } catch (err) {
        console.error("Failed to fetch users", err)
      } finally {
        setLoading(false)
      }
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
      const data = await res.json()
      setSentRequests(prev => ({ ...prev, [userId.toString()]: data._id }))
    }
  }

  const unfriend = async (userId) => {
    const requestId = friendRequestsRef.current[userId.toString()]
    if (!requestId) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/unfriend/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const next = { ...friendRequestsRef.current }
      delete next[userId.toString()]
      friendRequestsRef.current = next
      setFriendIds(prev => {
        const updated = new Set(prev)
        updated.delete(userId.toString())
        return updated
      })
      const target = results.find(u => u._id.toString() === userId.toString())
      if (target) showLocalToast(`You and ${target.username} are no longer friends`)
    }
  }

  const cancelRequest = async (userId) => {
    const requestId = sentRequests[userId.toString()]
    if (!requestId) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok || res.status === 404) {
      setSentRequests(prev => {
        const next = { ...prev }
        delete next[userId.toString()]
        return next
      })
      if (res.ok) showLocalToast("Friend request cancelled")
    }
  }

  const getButtonState = (user) => {
    const id = user._id.toString()
    if (friendIds.has(id)) return { label: "Friends", type: "friends", action: () => unfriend(user._id) }
    if (sentRequests[id]) return { label: "Requested", type: "requested", action: () => cancelRequest(user._id) }
    return { label: "Add Friend", type: "add", action: () => sendRequest(user._id) }
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

        <div className={styles.searchWrapper}>
          <input
            className={styles.input}
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {loading && <p className={styles.status}>Loading...</p>}
        {!loading && query && results && results.length === 0 && (
          <p className={styles.status}>No users found</p>
        )}

        <div className={styles.grid}>
          {results && results.map(user => {
            const btn = getButtonState(user)
            return (
              <div key={user._id} className={styles.card}>
                <div className={styles.avatar}>
                  {user.avatar
                    ? <img src={user.avatar} alt={user.username} className={styles.avatarImg} />
                    : user.username[0].toUpperCase()
                  }
                </div>
                <p className={styles.username}>{user.username}</p>
                <div className={styles.actions}>
                  <button
                    className={styles.outlineButton}
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    View Profile
                  </button>
                  <button
                    className={
                      btn.type === "friends" ? styles.buttonFriends :
                      btn.type === "requested" ? styles.buttonRequested :
                      styles.button
                    }
                    onClick={btn.action}
                  >
                    {btn.label}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {localToast && (
        <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-3 max-w-xs border border-gray-200 transition-opacity duration-1000 z-50 w-fit ${localToastVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-gray-700">{localToast}</p>
        </div>
      )}
    </div>
  )
}

export default PeoplePage
