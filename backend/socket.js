const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")

let io
const userSockets = new Map() // userId -> socketId

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      console.log(`[Socket] Auth rejected      | reason: no token provided`)
      return next(new Error("No token"))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.userId
      next()
    } catch (err) {
      console.log(`[Socket] Auth rejected      | reason: ${err.message}`)
      next(new Error("Invalid token"))
    }
  })

  io.on("connection", (socket) => {
    userSockets.set(socket.userId, socket.id)
    console.log(`[Socket] User connected    | userId: ${socket.userId} | socketId: ${socket.id} | active connections: ${userSockets.size}`)

    socket.on("disconnect", (reason) => {
      userSockets.delete(socket.userId)
      console.log(`[Socket] User disconnected | userId: ${socket.userId} | reason: ${reason} | active connections: ${userSockets.size}`)
    })
  })
}

function emitToUser(userId, event, data, label) {
  const socketId = userSockets.get(userId.toString())
  if (socketId && io) {
    io.to(socketId).emit(event, data)
    console.log(`[Socket] Notification sent  | event: ${event} | to: ${userId}${label ? " | " + label : ""}`)
  } else {
    console.log(`[Socket] User offline       | event: ${event} | to: ${userId}${label ? " | " + label : ""} (not delivered)`)
  }
}

module.exports = { initSocket, emitToUser }
