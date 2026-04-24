import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { getSocket } from "../../socket"
import styles from "./FriendsPage.module.css"

const TABS = ["Friends", "Pending", "Sent"]

function FriendsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("Friends")
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [sent, setSent] = useState([])
  const [friendSearch, setFriendSearch] = useState("")
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

  const load = async () => {
    const headers = { Authorization: `Bearer ${token}` }
    const [fRes, pRes, sRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/friendrequests/friends`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/friendrequests/pending`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/friendrequests/sent`, { headers })
    ])
    const [friendsData, pendingData, sentData] = await Promise.all([
      fRes.json(),
      pRes.json(),
      sRes.json()
    ])
    setFriends(Array.isArray(friendsData) ? friendsData.filter(r => r?.sender && r?.recipient) : [])
    setPending(Array.isArray(pendingData) ? pendingData.filter(r => r?.sender) : [])
    setSent(Array.isArray(sentData) ? sentData.filter(r => r?.recipient) : [])
  }

  useEffect(() => {
    load()

    const socket = getSocket()
    if (!socket) return

    const onRequestReceived = (request) => setPending(prev => [...prev, request])
    const onRequestCancelled = ({ requestId }) => setPending(prev => prev.filter(r => r._id !== requestId))
    const onRequestAccepted = (request) => {
      setSent(prev => prev.filter(r => r._id !== request._id))
      setFriends(prev => [...prev, request])
    }
    const onRequestDeclined = ({ requestId }) => setSent(prev => prev.filter(r => r._id !== requestId))
    const onUnfriended = ({ requestId }) => setFriends(prev => prev.filter(r => r._id !== requestId))
    const onUserProfileUpdated = ({ userId, username, avatar }) => {
      if (!userId) return
      const updateUser = (user) => {
        if (!user || typeof user !== "object" || !user._id) return user
        if (user._id.toString() !== userId.toString()) return user
        return {
          ...user,
          username: username ?? user.username,
          avatar: avatar ?? user.avatar
        }
      }

      setFriends(prev => prev.map(r => ({ ...r, sender: updateUser(r.sender), recipient: updateUser(r.recipient) })))
      setPending(prev => prev.map(r => ({ ...r, sender: updateUser(r.sender) })))
      setSent(prev => prev.map(r => ({ ...r, recipient: updateUser(r.recipient) })))
    }

    socket.on("friend_request_received", onRequestReceived)
    socket.on("friend_request_cancelled", onRequestCancelled)
    socket.on("friend_request_accepted", onRequestAccepted)
    socket.on("friend_request_declined", onRequestDeclined)
    socket.on("unfriended", onUnfriended)
    socket.on("user_profile_updated", onUserProfileUpdated)

    return () => {
      socket.off("friend_request_received", onRequestReceived)
      socket.off("friend_request_cancelled", onRequestCancelled)
      socket.off("friend_request_accepted", onRequestAccepted)
      socket.off("friend_request_declined", onRequestDeclined)
      socket.off("unfriended", onUnfriended)
      socket.off("user_profile_updated", onUserProfileUpdated)
    }
  }, [])

  const respond = async (requestId, status) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      if (status === 1) {
        const accepted = pending.find(r => r._id === requestId)
        if (accepted) {
          setPending(prev => prev.filter(r => r._id !== requestId))
          setFriends(prev => [...prev, { ...accepted, status: 1 }])
          window.dispatchEvent(new CustomEvent("friend-toast", { detail: { message: `You and ${accepted.sender.username} are now friends` } }))
        }
      } else {
        setPending(prev => prev.filter(r => r._id !== requestId))
      }
    }
  }

  const cancel = async (requestId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setSent(prev => prev.filter(r => r._id !== requestId))
  }

  const unfriend = async (requestId) => {
    const target = friends.find(r => r._id === requestId)
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/unfriend/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setFriends(prev => prev.filter(r => r._id !== requestId))
      if (target) {
        const otherUser = getFriendUser(target)
        showLocalToast(`You and ${otherUser.username} are no longer friends`)
      }
    }
  }

  const getFriendUser = (request) => {
    if (!request?.sender || !request?.recipient) return null
    return request.sender.username === myUsername ? request.recipient : request.sender
  }

  const filteredFriends = friendSearch.trim()
    ? friends.filter(r => {
        const user = getFriendUser(r)
        return user && user.username.toLowerCase().includes(friendSearch.toLowerCase())
      })
    : friends

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

        {tab === "Friends" && (
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search friends..."
            value={friendSearch}
            onChange={e => setFriendSearch(e.target.value)}
          />
        )}

        <div className={styles.list}>
          {tab === "Friends" && (
            filteredFriends.length === 0
              ? <p className={styles.empty}>{friendSearch ? "No friends match your search." : "No friends yet. Find people to add!"}</p>
              : filteredFriends.map(r => {
                  const user = getFriendUser(r)
                  if (!user) return null
                  return (
                    <div key={r._id} className={styles.card}>
                      <div className={styles.avatar}>
                        {user.avatar
                          ? <img src={user.avatar} alt={user.username} className={styles.avatarImg} />
                          : user.username[0].toUpperCase()
                        }
                      </div>
                      <div className={styles.info}>
                        <p className={styles.username}>{user.username}</p>
                      </div>
                      <div className={styles.actions}>
                        <button
                          className={styles.messageButton}
                          onClick={async () => {
                            const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ friendId: user._id })
                            })
                            const convo = await res.json()
                            navigate("/messages", { state: { convo } })
                          }}
                        >
                          Message
                        </button>
                        <button
                          className={styles.outlineButton}
                          onClick={() => navigate(`/profile/${user._id}`)}
                        >
                          View Profile
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => unfriend(r._id)}
                        >
                          Unfriend
                        </button>
                      </div>
                    </div>
                  )
                })
          )}

          {tab === "Pending" && (
            pending.length === 0
              ? <p className={styles.empty}>No pending requests</p>
              : pending.map(r => (
                  <div key={r._id} className={styles.card}>
                    <div className={styles.avatar}>
                      {r.sender.avatar
                        ? <img src={r.sender.avatar} alt={r.sender.username} className={styles.avatarImg} />
                        : r.sender.username[0].toUpperCase()
                      }
                    </div>
                    <div className={styles.info}>
                      <p className={styles.username}>{r.sender.username}</p>
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.acceptButton} onClick={() => respond(r._id, 1)}>
                        Accept
                      </button>
                      <button className={styles.declineButton} onClick={() => respond(r._id, 2)}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))
          )}

          {tab === "Sent" && (
            sent.length === 0
              ? <p className={styles.empty}>No sent requests</p>
              : sent.map(r => (
                  <div key={r._id} className={styles.card}>
                    <div className={styles.avatar}>
                      {r.recipient.avatar
                        ? <img src={r.recipient.avatar} alt={r.recipient.username} className={styles.avatarImg} />
                        : r.recipient.username[0].toUpperCase()
                      }
                    </div>
                    <div className={styles.info}>
                      <p className={styles.username}>{r.recipient.username}</p>
                    </div>
                    <button className={styles.cancelButton} onClick={() => cancel(r._id)}>
                      Cancel
                    </button>
                  </div>
                ))
          )}
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

export default FriendsPage
