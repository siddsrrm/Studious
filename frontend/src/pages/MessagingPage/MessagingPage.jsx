import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import styles from "./MessagingPage.module.css"

function MessagingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const myUsername = localStorage.getItem("username")
  const myUserId = localStorage.getItem("userId")
  const token = localStorage.getItem("token")
  const [conversations, setConversations] = useState([])
  const [selectedConvo, setSelectedConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [showNewConvo, setShowNewConvo] = useState(false)
  const [friends, setFriends] = useState([])

  const loadConversations = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setConversations(data)
  }

  const loadFriends = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/friendrequests/friends`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setFriends(Array.isArray(data) ? data.filter(r => r?.sender && r?.recipient) : [])
  }

  const getFriendUser = (request) => {
    return request.sender.username === myUsername ? request.recipient : request.sender
  }

  const getOtherParticipant = (convo) => {
    return convo.participants.find(p => p._id !== myUserId)
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (location.state?.convo) {
      selectConversation(location.state.convo)
    }
  }, [location.state])

  const loadMessages = async (convoId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations/${convoId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setMessages(data)
  }

  const markAsRead = async (convoId) => {
    await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations/${convoId}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  const selectConversation = async (convo) => {
    console.log("selecting convo:", convo)
    console.log("myUserId:", myUserId)
    console.log("other participant:", getOtherParticipant(convo))
    setSelectedConvo(convo)
    await loadMessages(convo._id)
    await markAsRead(convo._id)
  }

  const startConversation = async (friendId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ friendId })
    })
    const convo = await res.json()
    console.log("convo returned:", convo)
    setShowNewConvo(false)
    await loadConversations()
    selectConversation(convo)
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedConvo) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations/${selectedConvo._id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: inputValue })
    })

    const msg = await res.json()
    setMessages(prev => [...prev, msg])
    setInputValue("")
  }


  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate("/home")}>← Back</button>
        <h1 className={styles.topBarTitle}>Studious</h1>
        <p className={styles.topBarWelcome}>Welcome, {myUsername}!</p>
      </div>

      <div className={styles.layout}>
        {/* Left sidebar — conversation list */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitleRow}>
              <h2 className={styles.sidebarTitle}>Messages</h2>
              <button
                className={styles.newConvoButton}
                onClick={() => { setShowNewConvo(true); loadFriends() }}
                title="New conversation"
              >+</button>
            </div>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search conversations..."
            />
          </div>

          <div className={styles.convoList}>
            {conversations.length === 0
              ? <p className={styles.empty}>No conversations yet.<br />Message a friend to get started.</p>
              : conversations.map(convo => {
                  const other = getOtherParticipant(convo)
                  if (!other) return null
                  return (
                    <div
                      key={convo._id}
                      className={`${styles.convoItem} ${selectedConvo?._id === convo._id ? styles.convoItemActive : ""}`}
                      onClick={() => selectConversation(convo)}
                    >
                      <div className={styles.avatar}>
                        {other.avatar
                          ? <img src={other.avatar} alt={other.username} className={styles.avatarImg} />
                          : other.username[0].toUpperCase()
                        }
                      </div>
                      <div className={styles.convoInfo}>
                        <p className={styles.convoName}>{other.username}</p>
                        {convo.lastMessage && (
                          <p className={styles.convoPreview}>{convo.lastMessage.content}</p>
                        )}
                      </div>
                      {convo.unreadCount?.[myUserId] > 0 && (
                        <div className={styles.convoMeta}>
                          <span className={styles.unreadBadge}>{convo.unreadCount[myUserId]}</span>
                        </div>
                      )}
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Right panel — chat area */}
        <div className={styles.chatPanel}>
          {selectedConvo === null ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <p className={styles.emptyStateText}>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.avatar}>
                  {getOtherParticipant(selectedConvo)?.avatar
                    ? <img src={getOtherParticipant(selectedConvo).avatar} alt="" className={styles.avatarImg} />
                    : getOtherParticipant(selectedConvo)?.username[0].toUpperCase()
                  }
                </div>
                <div className={styles.chatHeaderInfo}>
                  <p className={styles.chatHeaderName}>{getOtherParticipant(selectedConvo)?.username}</p>
                </div>
              </div>

              <div className={styles.messagesArea}>
                {messages.length === 0
                  ? <p className={styles.empty}>No messages yet. Say hello!</p>
                  : messages.map(msg => (
                      <div
                        key={msg._id}
                        className={`${styles.messageBubble} ${msg.senderId?.toString() === myUserId ? styles.messageSent : styles.messageReceived}`}
                      >
                        {msg.content}
                      </div>
                    ))
                }
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
            </>
          )}
        </div>
      </div>

      {/* New conversation overlay */}
      {showNewConvo && (
        <div className={styles.overlay} onClick={() => setShowNewConvo(false)}>
          <div className={styles.picker} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <h3 className={styles.pickerTitle}>New Message</h3>
              <button className={styles.pickerClose} onClick={() => setShowNewConvo(false)}>✕</button>
            </div>
            <div className={styles.pickerList}>
              {friends.length === 0
                ? <p className={styles.empty}>No friends to message.</p>
                : friends.map(r => {
                    const user = getFriendUser(r)
                    return (
                      <div key={r._id} className={styles.pickerItem} onClick={() => startConversation(user._id)}>
                        <div className={styles.avatar}>
                          {user.avatar
                            ? <img src={user.avatar} alt={user.username} className={styles.avatarImg} />
                            : user.username[0].toUpperCase()
                          }
                        </div>
                        <p className={styles.pickerName}>{user.username}</p>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagingPage
