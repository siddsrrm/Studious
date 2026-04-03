import { io } from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_API_URL.replace("/api", "")

let socket = null

function createSocket(token) {
  const nextSocket = io(SOCKET_URL, {
    auth: { token }
  })
  nextSocket.on("connect", () => {
    console.log("[Socket] Connected:", nextSocket.id)
  })
  nextSocket.on("connect_error", (err) => {
    console.error("[Socket] Connection failed:", err.message)
  })
  return nextSocket
}

export function getSocket() {
  const token = localStorage.getItem("token")
  if (!token) return null

  if (socket && socket.auth?.token !== token) {
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    socket = createSocket(token)
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
