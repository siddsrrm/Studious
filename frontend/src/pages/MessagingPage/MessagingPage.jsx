import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./MessagingPage.module.css"

function MessagingPage() {
  const navigate = useNavigate()
  const myUsername = localStorage.getItem("username")
  const [selectedConvo, setSelectedConvo] = useState(null)
  const [inputValue, setInputValue] = useState("")

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
            <h2 className={styles.sidebarTitle}>Messages</h2>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search conversations..."
            />
          </div>

          <div className={styles.convoList}>
            <p className={styles.empty}>No conversations yet.<br />Message a friend to get started.</p>
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
                  {selectedConvo.username[0].toUpperCase()}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <p className={styles.chatHeaderName}>{selectedConvo.username}</p>
                </div>
              </div>

              <div className={styles.messagesArea}>
                <p className={styles.empty}>No messages yet. Say hello!</p>
              </div>

              <div className={styles.inputArea}>
                <input
                  className={styles.messageInput}
                  type="text"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                />
                <button className={styles.sendButton}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagingPage
