import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getSocket } from "../../socket"
import styles from "./GroupDashboardPage.module.css"

const TABS = ["Chat", "Notes", "Members"]

function GroupDashboardPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const myUsername = localStorage.getItem("username")
  const myUserId = localStorage.getItem("userId")
  const token = localStorage.getItem("token")

  const [group, setGroup] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Chat")
  const [messages, setMessages] = useState([])
  const [notes, setNotes] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [showAddMember, setShowAddMember] = useState(false)
  const [friends, setFriends] = useState([])
  const [showShareNote, setShowShareNote] = useState(false)
  const [myNotes, setMyNotes] = useState([])
  const [viewNote, setViewNote] = useState(null)
  const [joinRequested, setJoinRequested] = useState(false)
  const [privacy, setPrivacy] = useState("open")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const messagesEndRef = useRef(null)

  const loadGroup = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setGroup(data)
      setPrivacy(data.privacy ?? "open")
      const alreadyRequested = data.joinRequests?.some(r => r._id?.toString() === myUserId)
      setJoinRequested(alreadyRequested)
    }
  }

  const loadMessages = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setMessages(await res.json())
  }

  const loadNotes = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setNotes(await res.json())
  }

  const loadFriends = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/friends`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setFriends(Array.isArray(data) ? data.filter(r => r?.sender && r?.recipient) : [])
  }

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await loadGroup()
      await loadMessages()
      setIsLoading(false)
    }
    init()

    const socket = getSocket()
    if (!socket) return

    const onGroupMessage = (msg) => {
      if (msg.groupId === groupId) setMessages(prev => [...prev, msg])
    }
    const onJoinRequest = (data) => {
      if (data.groupId === groupId) {
        setGroup(prev => prev ? {
          ...prev,
          joinRequests: [...(prev.joinRequests ?? []), data.user]
        } : prev)
      }
    }
    const onMemberJoined = (data) => {
      if (data.groupId === groupId) {
        setGroup(prev => prev ? {
          ...prev,
          members: [...(prev.members ?? []), data.member],
          joinRequests: (prev.joinRequests ?? []).filter(r => r._id?.toString() !== data.member._id?.toString())
        } : prev)
      }
    }
    const onMemberRemoved = (data) => {
      if (data.groupId === groupId) {
        if (data.userId === myUserId) {
          navigate("/mygroups")
        } else {
          setGroup(prev => prev ? {
            ...prev,
            members: (prev.members ?? []).filter(m => m._id?.toString() !== data.userId)
          } : prev)
        }
      }
    }
    const onNoteShared = (data) => {
      if (data.groupId === groupId) setNotes(prev => [...prev, data.note])
    }
    const onNoteRemoved = (data) => {
      if (data.groupId === groupId) setNotes(prev => prev.filter(n => n._id !== data.noteId))
    }
    const onGroupDeleted = (data) => {
      if (data.groupId === groupId) navigate("/mygroups")
    }
    const onRequestAccepted = (data) => {
      if (data.groupId === groupId) loadGroup()
    }
    const onPrivacyChanged = (data) => {
      if (data.groupId === groupId) {
        setPrivacy(data.privacy)
        setGroup(prev => prev ? { ...prev, privacy: data.privacy } : prev)
      }
    }

    socket.on("group_message_received", onGroupMessage)
    socket.on("group_join_request", onJoinRequest)
    socket.on("group_member_joined", onMemberJoined)
    socket.on("group_member_removed", onMemberRemoved)
    socket.on("group_note_shared", onNoteShared)
    socket.on("group_note_removed", onNoteRemoved)
    socket.on("group_deleted", onGroupDeleted)
    socket.on("group_request_accepted", onRequestAccepted)
    socket.on("group_privacy_changed", onPrivacyChanged)

    return () => {
      socket.off("group_message_received", onGroupMessage)
      socket.off("group_join_request", onJoinRequest)
      socket.off("group_member_joined", onMemberJoined)
      socket.off("group_member_removed", onMemberRemoved)
      socket.off("group_note_shared", onNoteShared)
      socket.off("group_note_removed", onNoteRemoved)
      socket.off("group_deleted", onGroupDeleted)
      socket.off("group_request_accepted", onRequestAccepted)
      socket.off("group_privacy_changed", onPrivacyChanged)
    }
  }, [groupId])

  useEffect(() => {
    if (activeTab === "Notes") loadNotes()
  }, [activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isMember = group?.members?.some(m => m._id?.toString() === myUserId)
  const members = group?.members ?? []
  const joinRequests = group?.joinRequests ?? []
  const isOwner = group?.createdBy?._id?.toString() === myUserId || group?.createdBy?.toString() === myUserId

  const sendMessage = async () => {
    if (!inputValue.trim()) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: inputValue })
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, { ...msg, senderId: { _id: myUserId, username: myUsername } }])
      setInputValue("")
    }
  }

  const requestToJoin = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.joined) {
        await loadGroup()
      } else {
        setJoinRequested(true)
      }
    }
  }

  const leaveGroup = async () => {
    if (!window.confirm(`Leave "${group.name}"?`)) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/members/${myUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) navigate("/mygroups")
  }

  const changePrivacy = async (newPrivacy) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/privacy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ privacy: newPrivacy })
    })
    if (res.ok) setPrivacy(newPrivacy)
  }

  const acceptRequest = async (userId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/join/${userId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) await loadGroup()
  }

  const declineRequest = async (userId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/join/${userId}/decline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) await loadGroup()
  }

  const loadMyNotes = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/notes/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setMyNotes(await res.json())
  }

  const shareNote = async (noteId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ noteId })
    })
    if (res.ok) {
      setShowShareNote(false)
      await loadNotes()
    }
  }

  const deleteNote = async (noteId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/notes/${noteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setNotes(prev => prev.filter(n => n._id !== noteId))
  }

  const deleteGroup = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) navigate("/mygroups")
  }

  const addMember = async (userId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId })
    })
    if (res.ok) {
      setShowAddMember(false)
      await loadGroup()
    }
  }

  const removeMember = async (userId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/studygroups/${groupId}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) await loadGroup()
  }

  const getFriendUser = (r) =>
    r.sender.username === myUsername ? r.recipient : r.sender

  const memberIds = new Set(members.map(m => m._id?.toString()))
  const nonMemberFriends = friends.filter(r => {
    const user = getFriendUser(r)
    return !memberIds.has(user._id?.toString())
  })

  const getSenderId = (msg) =>
    typeof msg.senderId === "object" ? msg.senderId._id?.toString() : msg.senderId?.toString()

  const getSenderName = (msg) =>
    typeof msg.senderId === "object" ? msg.senderId.username : msg.senderUsername

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={() => navigate("/mygroups")}>← Back</button>
          <h1 className={styles.topBarTitle}>Studious</h1>
          <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
        </div>
        <div className={styles.content}>
          <p className={styles.status}>Loading group...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={() => navigate("/mygroups")}>← Back</button>
          <h1 className={styles.topBarTitle}>Studious</h1>
          <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
        </div>
        <div className={styles.content}>
          <p className={styles.status}>Group not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate("/mygroups")}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.content}>
        <div className={styles.groupHeader}>
          <div className={styles.groupAvatar}>{group.name[0].toUpperCase()}</div>
          <div className={styles.groupHeaderInfo}>
            <h2 className={styles.groupName}>{group.name}</h2>
            <p className={styles.groupMeta}>{members.length} members</p>
          </div>
          {isOwner && (
            <button className={styles.deleteGroupButton} onClick={() => setShowDeleteConfirm(true)}>Delete Group</button>
          )}
          {isMember && !isOwner && (
            <button className={styles.leaveGroupButton} onClick={leaveGroup}>Leave Group</button>
          )}
        </div>
        <hr className={styles.contentDivider} />

        {/* Non-member view */}
        {!isMember && (
          <div className={styles.joinCard}>
            <p className={styles.joinText}>You are not a member of this group.</p>
            {joinRequested
              ? <button className={styles.requestedButton} disabled>Request Sent</button>
              : <button className={styles.joinButton} onClick={requestToJoin}>
                  {privacy === "open" ? "Join Group" : "Request to Join"}
                </button>
            }
          </div>
        )}

        {/* Member view */}
        {isMember && (
          <div className={styles.tabContainer}>
            <div className={styles.tabs}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {tab === "Members" && isOwner && joinRequests.length > 0 && (
                    <span className={styles.requestsBadge}>{joinRequests.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Chat */}
            {activeTab === "Chat" && (
              <div className={styles.chatPanel}>
                <div className={styles.messagesArea}>
                  {messages.length === 0
                    ? <p className={styles.empty}>No messages yet. Say something!</p>
                    : messages.map(msg => (
                        <div
                          key={msg._id}
                          className={`${styles.messageWrapper} ${getSenderId(msg) === myUserId ? styles.messageWrapperSent : styles.messageWrapperReceived}`}
                        >
                          <p className={styles.messageSender}>{getSenderName(msg) ?? myUsername}</p>
                          <div className={`${styles.messageBubble} ${getSenderId(msg) === myUserId ? styles.messageSent : styles.messageReceived}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                  }
                  <div ref={messagesEndRef} />
                </div>
                <div className={styles.inputArea}>
                  <input
                    className={styles.messageInput}
                    type="text"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                  />
                  <button className={styles.sendButton} onClick={sendMessage}>Send</button>
                </div>
              </div>
            )}

            {/* Notes */}
            {activeTab === "Notes" && (
              <div className={styles.notesPanel}>
                <div className={styles.panelToolbar}>
                  <button className={styles.toolbarButton} onClick={() => { setShowShareNote(true); loadMyNotes() }}>+ Share Note</button>
                </div>
                {notes.length === 0
                  ? <p className={styles.empty}>No shared notes yet.</p>
                  : notes.map(note => (
                      <div key={note._id} className={styles.noteCard} onClick={() => setViewNote(note)}>
                        <div className={styles.noteCardInfo}>
                          <p className={styles.noteTitle}>{note.title}</p>
                          <p className={styles.noteMeta}>by {note.ownerID?.username}</p>
                        </div>
                        <button className={styles.deleteNoteButton} onClick={e => { e.stopPropagation(); deleteNote(note._id) }}>✕</button>
                      </div>
                    ))
                }
              </div>
            )}

            {/* Members */}
            {activeTab === "Members" && (
              <div className={styles.membersPanel}>
                <div className={styles.panelToolbar}>
                  {isOwner && (
                    <div className={styles.privacyToggle}>
                      <button
                        className={`${styles.privacyOption} ${privacy === "open" ? styles.privacyActive : ""}`}
                        onClick={() => changePrivacy("open")}
                      >Open</button>
                      <button
                        className={`${styles.privacyOption} ${privacy === "request" ? styles.privacyActive : ""}`}
                        onClick={() => changePrivacy("request")}
                      >Requests Only</button>
                    </div>
                  )}
                  <button className={styles.toolbarButton} onClick={() => { setShowAddMember(true); loadFriends() }}>+ Add Member</button>
                </div>

                {/* Join requests — owner only */}
                {isOwner && joinRequests.length > 0 && (
                  <div className={styles.joinRequestsSection}>
                    <p className={styles.joinRequestsTitle}>Join Requests</p>

                    {joinRequests.map(user => (
                      <div key={user._id} className={styles.requestCard}>
                        <div className={styles.requestAvatar}>
                          {user.avatar
                            ? <img src={user.avatar} alt={user.username} className={styles.memberAvatarImg} />
                            : user.username[0].toUpperCase()
                          }
                        </div>
                        <div className={styles.requestInfo}>
                          <p className={styles.requestUsername}>{user.username}</p>
                          <p className={styles.requestSub}>Wants to join this group</p>
                        </div>
                        <div className={styles.requestActions}>
                          <button className={styles.acceptButton} onClick={() => acceptRequest(user._id)}>Accept</button>
                          <button className={styles.declineButton} onClick={() => declineRequest(user._id)}>Decline</button>
                        </div>
                      </div>
                    ))}
                    <hr className={styles.sectionDivider} />
                  </div>
                )}

                {members.map(member => (
                  <div key={member._id} className={styles.memberItem}>
                    <div className={styles.memberAvatar}>
                      {member.avatar
                        ? <img src={member.avatar} alt={member.username} className={styles.memberAvatarImg} />
                        : member.username[0].toUpperCase()
                      }
                    </div>
                    <p className={styles.memberName} onClick={() => navigate(`/profile/${member._id}`)}>
                      {member.username}
                    </p>
                    {group.createdBy?._id?.toString() === member._id?.toString() && (
                      <span className={styles.ownerBadge}>Owner</span>
                    )}
                    {isOwner && group.createdBy?._id?.toString() !== member._id?.toString() && (
                      <button className={styles.removeButton} onClick={() => removeMember(member._id)}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add member overlay */}
      {showAddMember && (
        <div className={styles.overlay} onClick={() => setShowAddMember(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Member</h3>
              <button className={styles.modalClose} onClick={() => setShowAddMember(false)}>✕</button>
            </div>
            <div className={styles.modalList}>
              {nonMemberFriends.length === 0
                ? <p className={styles.empty}>No friends to add.</p>
                : nonMemberFriends.map(r => {
                    const user = getFriendUser(r)
                    return (
                      <div key={r._id} className={styles.modalItem} onClick={() => addMember(user._id)}>
                        <div className={styles.memberAvatar}>
                          {user.avatar
                            ? <img src={user.avatar} alt={user.username} className={styles.memberAvatarImg} />
                            : user.username[0].toUpperCase()
                          }
                        </div>
                        <p className={styles.modalItemName}>{user.username}</p>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>
      )}

      {/* Share note picker */}
      {showShareNote && (
        <div className={styles.overlay} onClick={() => setShowShareNote(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Share a Note</h3>
              <button className={styles.modalClose} onClick={() => setShowShareNote(false)}>✕</button>
            </div>
            <div className={styles.modalList}>
              {(() => {
                const available = myNotes.filter(n =>
                  !(n.groupIds ?? []).some(id => id === groupId || id?.toString() === groupId)
                )
                return available.length === 0
                  ? <p className={styles.empty}>No notes to share (all already shared or none exist).</p>
                  : available.map(note => (
                      <div key={note._id} className={styles.modalItem} onClick={() => shareNote(note._id)}>
                        <div className={styles.noteCardInfo}>
                          <p className={styles.modalItemName}>{note.title || "Untitled"}</p>
                          <p className={styles.noteMeta}>
                            {note.studyPlanID?.title
                              ? `from ${note.studyPlanID.title}`
                              : "from a study plan"}
                          </p>
                        </div>
                      </div>
                    ))
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete group confirmation */}
      {showDeleteConfirm && (
        <div className={styles.overlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmTitle}>Delete &ldquo;{group.name}&rdquo;?</p>
            <p className={styles.confirmBody}>This will permanently delete the group and all its content. There is no way to recover it after confirmation.</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className={styles.confirmDelete} onClick={deleteGroup}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View note modal */}
      {viewNote && (
        <div className={styles.overlay} onClick={() => setViewNote(null)}>
          <div className={styles.noteViewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{viewNote.title || "Untitled"}</h3>
              <button className={styles.modalClose} onClick={() => setViewNote(null)}>✕</button>
            </div>
            <div className={styles.noteViewBody}>
              <p className={styles.noteMeta}>Shared by {viewNote.ownerID?.username}</p>
              {viewNote.content
                ? <div className={styles.noteViewContent} dangerouslySetInnerHTML={{ __html: viewNote.content }} />
                : <p className={styles.noteViewContent}>No content.</p>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupDashboardPage
