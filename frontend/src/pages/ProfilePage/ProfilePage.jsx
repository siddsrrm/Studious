import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getSocket } from "../../socket"
import styles from "./ProfilePage.module.css"

function ProfilePage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const token = localStorage.getItem("token")
  const myUsername = localStorage.getItem("username")

  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [friendIds, setFriendIds] = useState(new Set())
  const [sentRequests, setSentRequests] = useState({})
  const [pendingRequests, setPendingRequests] = useState({})
  const friendRequestsRef = useRef({})
  const [earnedAchievements, setEarnedAchievements] = useState([])
  const [achievementDefs, setAchievementDefs] = useState([])
  const [localToast, setLocalToast] = useState(null)
  const [localToastVisible, setLocalToastVisible] = useState(false)
  const toastTimers = useRef([])

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
    const loadPage = async () => {
      setIsLoading(true)
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [profileRes, friendsRes, sentRes, pendingRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/friendrequests/friends`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/friendrequests/sent`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/friendrequests/pending`, { headers })
        ])

        if (!profileRes.ok) {
          setProfile(null)
          return
        }

        const [achievementsRes, defsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/achievements/user/${userId}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/achievements/definitions`)
        ])
        const [profileData, friends, sent, pending, earnedData, defsData] = await Promise.all([
          profileRes.json(),
          friendsRes.json(),
          sentRes.json(),
          pendingRes.json(),
          achievementsRes.ok ? achievementsRes.json() : Promise.resolve([]),
          defsRes.ok ? defsRes.json() : Promise.resolve([])
        ])
        setEarnedAchievements(earnedData)
        setAchievementDefs(defsData)

        setProfile(profileData)

        const friendMap = {}
        friends.forEach(r => {
          const otherId = r.sender.username === myUsername ? r.recipient?._id?.toString() : r.sender?._id?.toString()
          if (otherId) friendMap[otherId] = r._id
        })
        friendRequestsRef.current = friendMap
        setFriendIds(new Set(Object.keys(friendMap)))

        const sentMap = {}
        sent.forEach(r => {
          const recipientId = r.recipient?._id?.toString()
          if (recipientId) sentMap[recipientId] = r._id
        })
        setSentRequests(sentMap)

        const pendingMap = {}
        pending.forEach(r => {
          const senderId = r.sender?._id?.toString()
          if (senderId) pendingMap[senderId] = r._id
        })
        setPendingRequests(pendingMap)
      } catch {
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPage()

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
      setPendingRequests(prev => {
        const next = { ...prev }
        delete next[friendId]
        return next
      })
    }

    const onRequestReceived = (request) => {
      const senderId = request?.sender?._id?.toString()
      if (!senderId) return
      setPendingRequests(prev => ({ ...prev, [senderId]: request._id }))
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

    const onRequestDeclined = ({ requestId }) => clearSentRequestById(requestId)
    const onRequestCancelled = ({ requestId }) => {
      clearSentRequestById(requestId)
      setPendingRequests(prev => {
        const entry = Object.entries(prev).find(([, rId]) => rId === requestId)
        if (!entry) return prev
        const next = { ...prev }
        delete next[entry[0]]
        return next
      })
    }

    const onUserProfileUpdated = ({ userId: changedUserId, username, avatar }) => {
      if (!changedUserId || !profile || profile._id.toString() !== changedUserId.toString()) return
      setProfile(prev => prev ? ({
        ...prev,
        username: username ?? prev.username,
        avatar: avatar ?? prev.avatar
      }) : prev)
    }

    socket.on("friend_request_received", onRequestReceived)
    socket.on("friend_request_accepted", onRequestAccepted)
    socket.on("friend_request_declined", onRequestDeclined)
    socket.on("friend_request_cancelled", onRequestCancelled)
    socket.on("unfriended", onUnfriended)
    socket.on("user_profile_updated", onUserProfileUpdated)

    return () => {
      socket.off("friend_request_received", onRequestReceived)
      socket.off("friend_request_accepted", onRequestAccepted)
      socket.off("friend_request_declined", onRequestDeclined)
      socket.off("friend_request_cancelled", onRequestCancelled)
      socket.off("unfriended", onUnfriended)
      socket.off("user_profile_updated", onUserProfileUpdated)
    }
  }, [token, userId])

  const sendRequest = async (targetUserId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipientId: targetUserId })
    })
    if (res.ok) {
      const data = await res.json()
      setSentRequests(prev => ({ ...prev, [targetUserId.toString()]: data._id }))
    }
  }

  const cancelRequest = async (targetUserId) => {
    const requestId = sentRequests[targetUserId.toString()]
    if (!requestId) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok || res.status === 404) {
      setSentRequests(prev => {
        const next = { ...prev }
        delete next[targetUserId.toString()]
        return next
      })
      if (res.ok) showLocalToast("Friend request cancelled")
    }
  }

  const unfriend = async (targetUserId) => {
    const requestId = friendRequestsRef.current[targetUserId.toString()]
    if (!requestId) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/unfriend/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const next = { ...friendRequestsRef.current }
      delete next[targetUserId.toString()]
      friendRequestsRef.current = next
      setFriendIds(prev => {
        const updated = new Set(prev)
        updated.delete(targetUserId.toString())
        return updated
      })
      if (profile) showLocalToast(`You and ${profile.username} are no longer friends`)
    }
  }

  const respondToRequest = async (targetUserId, status) => {
    const requestId = pendingRequests[targetUserId.toString()]
    if (!requestId) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    if (!res.ok) return

    setPendingRequests(prev => {
      const next = { ...prev }
      delete next[targetUserId.toString()]
      return next
    })

    if (status === 1) {
      friendRequestsRef.current = { ...friendRequestsRef.current, [targetUserId.toString()]: requestId }
      setFriendIds(prev => new Set([...prev, targetUserId.toString()]))
      if (profile) showLocalToast(`You and ${profile.username} are now friends`)
    }
  }

  const getButtonState = () => {
    if (!profile) return { label: "Add Friend", type: "add", action: () => {} }
    const id = profile._id.toString()
    if (friendIds.has(id)) return { label: "Friends", type: "friends", action: () => unfriend(id) }
    if (pendingRequests[id]) return { type: "pending" }
    if (sentRequests[id]) return { label: "Requested", type: "requested", action: () => cancelRequest(id) }
    return { label: "Add Friend", type: "add", action: () => sendRequest(id) }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.content}><p className={styles.status}>Loading profile...</p></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>← Back</button>
          <h1 className={styles.topBarTitle}>Studious</h1>
          <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
        </div>
        <div className={styles.content}><p className={styles.status}>User not found.</p></div>
      </div>
    )
  }

  const isSelf = profile.username === myUsername
  const btn = getButtonState()

  const earnedMap = {}
  earnedAchievements.forEach(e => { earnedMap[e.achievementId] = e.earnedAt })
  const achievements = achievementDefs.map(a => ({
    ...a,
    unlocked: !!earnedMap[a.id],
    unlockedAt: earnedMap[a.id] || null
  }))

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.content}>
        <h2 className={styles.contentTitle}>Profile</h2>
        <p className={styles.contentDescription}>View user information and manage friendship.</p>
        <hr className={styles.contentDivider} />

        <div className={styles.card}>
          <div className={styles.avatar}>
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.username} className={styles.avatarImg} />
              : profile.username[0].toUpperCase()
            }
          </div>
          <p className={styles.username}>{profile.username}</p>

          {!isSelf && btn.type === "pending" && (
            <div className={styles.pendingActions}>
              <button className={styles.acceptButton} onClick={() => respondToRequest(profile._id, 1)}>Accept</button>
              <button className={styles.declineButton} onClick={() => respondToRequest(profile._id, 2)}>Decline</button>
            </div>
          )}

          {!isSelf && btn.type !== "pending" && (
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
          )}
        </div>

        {/* Progress Section */}
        {!!profile.progress && (
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Progress</h3>
            <p className={styles.sectionDescription}>
              {profile.progress.totalTasksFinished ?? 0} of {profile.progress.totalTasks ?? 0} tasks completed
            </p>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Overall completion</span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {(Number(profile.progress.score ?? 0)).toFixed(2)}%
                </span>
              </div>
              <div style={{ width: "100%", backgroundColor: "#e0e7ff", borderRadius: "9999px", height: "10px" }}>
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, Number(profile.progress.score ?? 0)))}%`,
                    backgroundColor: "#4f46e5",
                    borderRadius: "9999px",
                    height: "10px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Achievements Section */}
        {achievementDefs.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Achievements</h3>
            <p className={styles.sectionDescription}>
              {achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked
            </p>
            <div className={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`${styles.achievementBadge} ${achievement.unlocked ? styles.unlocked : styles.locked}`}>
                  <div className={styles.badgeTooltip}>
                    <div className={styles.tooltipTitle}>{achievement.name}</div>
                    <div className={styles.tooltipDescription}>{achievement.description}</div>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className={styles.tooltipDate}>
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <img
                    src={`/badges/${achievement.badge}`}
                    alt={achievement.name}
                    className={styles.badgeImage}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {localToast && (
        <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-3 max-w-xs border border-gray-200 transition-opacity duration-1000 z-50 w-fit ${localToastVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-gray-700">{localToast}</p>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
