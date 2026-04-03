import { io } from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_API_URL.replace("/api", "")

let socket = null

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("token")
    socket = io(SOCKET_URL, {
      auth: { token }
    })
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id)
    })
    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection failed:", err.message)
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
