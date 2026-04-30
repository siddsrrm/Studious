const messageController = require("../controllers/messageController")
const conversationController = require("../controllers/conversationController")
const Message = require("../models/Message")
const Conversation = require("../models/Conversation")
const User = require("../models/User")

jest.mock("../models/Message")
jest.mock("../models/Conversation")
jest.mock("../models/User")
jest.mock("../socket", () => ({ emitToUser: jest.fn() }))

const { emitToUser } = require("../socket")

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

const makeReq = (overrides = {}) => ({
  user: { userId: "user1" },
  params: {},
  body: {},
  ...overrides,
})

beforeEach(() => jest.clearAllMocks())

// ─── getMessages ──────────────────────────────────────────────────────────────

describe("getMessages", () => {
  test("returns messages sorted by createdAt", async () => {
    const msgs = [{ _id: "m1", content: "hi" }]
    Message.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(msgs) })

    const req = makeReq({ params: { conversationId: "conv1" } })
    const res = makeRes()
    await messageController.getMessages(req, res)

    expect(Message.find).toHaveBeenCalledWith({ conversationId: "conv1" })
    expect(res.json).toHaveBeenCalledWith(msgs)
  })

  test("returns 500 on database error", async () => {
    Message.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error("DB error")) })

    const res = makeRes()
    await messageController.getMessages(makeReq({ params: { conversationId: "conv1" } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch messages" })
  })
})

// ─── sendMessage ──────────────────────────────────────────────────────────────

describe("sendMessage", () => {
  const SENDER_ID = "user1"
  const RECIPIENT_ID = "user2"
  const CONV_ID = "conv1"

  const mockConvo = {
    participants: [
      { toString: () => SENDER_ID },
      { toString: () => RECIPIENT_ID },
    ],
  }

  const mockMsg = { _id: "msg1", content: "hello", createdAt: new Date() }
  const mockSender = { username: "alice" }

  beforeEach(() => {
    Message.create.mockResolvedValue(mockMsg)
    Conversation.findById.mockResolvedValue(mockConvo)
    Conversation.findByIdAndUpdate.mockResolvedValue(null)
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockSender) })
  })

  test("creates a message and returns it", async () => {
    const req = makeReq({ params: { conversationId: CONV_ID }, body: { content: "hello" } })
    const res = makeRes()
    await messageController.sendMessage(req, res)

    expect(Message.create).toHaveBeenCalledWith({ conversationId: CONV_ID, senderId: SENDER_ID, content: "hello" })
    expect(res.json).toHaveBeenCalledWith(mockMsg)
  })

  test("updates conversation lastMessage and unreadCount for recipient", async () => {
    const req = makeReq({ params: { conversationId: CONV_ID }, body: { content: "hello" } })
    const res = makeRes()
    await messageController.sendMessage(req, res)

    expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith(CONV_ID, expect.objectContaining({
      lastMessage: expect.objectContaining({ content: "hello", senderId: SENDER_ID }),
      $inc: { [`unreadCount.${RECIPIENT_ID}`]: 1 }
    }))
  })

  test("emits message_received to recipient via socket", async () => {
    const req = makeReq({ params: { conversationId: CONV_ID }, body: { content: "hello" } })
    const res = makeRes()
    await messageController.sendMessage(req, res)

    expect(emitToUser).toHaveBeenCalledWith(RECIPIENT_ID, "message_received", expect.objectContaining({
      conversationId: CONV_ID,
      content: "hello",
      senderUsername: "alice",
    }))
  })

  test("does not emit to sender", async () => {
    const req = makeReq({ params: { conversationId: CONV_ID }, body: { content: "hello" } })
    const res = makeRes()
    await messageController.sendMessage(req, res)

    const calls = emitToUser.mock.calls
    expect(calls.every(([userId]) => userId !== SENDER_ID)).toBe(true)
  })

  test("returns 500 on error", async () => {
    Message.create.mockRejectedValue(new Error("DB error"))
    const req = makeReq({ params: { conversationId: CONV_ID }, body: { content: "hello" } })
    const res = makeRes()
    await messageController.sendMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to send message" })
  })
})

// ─── markAsRead ───────────────────────────────────────────────────────────────

describe("markAsRead", () => {
  test("unsets unreadCount for current user", async () => {
    Conversation.findByIdAndUpdate.mockResolvedValue(null)

    const req = makeReq({ params: { conversationId: "conv1" }, user: { userId: "user1" } })
    const res = makeRes()
    await messageController.markAsRead(req, res)

    expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith("conv1", {
      $unset: { "unreadCount.user1": "" }
    })
    expect(res.json).toHaveBeenCalledWith({ message: "Marked as read" })
  })

  test("returns 500 on error", async () => {
    Conversation.findByIdAndUpdate.mockRejectedValue(new Error("DB error"))

    const req = makeReq({ params: { conversationId: "conv1" } })
    const res = makeRes()
    await messageController.markAsRead(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to mark as read" })
  })
})

// ─── getConversations ─────────────────────────────────────────────────────────

describe("getConversations", () => {
  test("returns conversations for current user", async () => {
    const convos = [{ _id: "conv1", participants: [] }]
    Conversation.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(convos) })

    const req = makeReq()
    const res = makeRes()
    await conversationController.getConversations(req, res)

    expect(Conversation.find).toHaveBeenCalledWith({ participants: "user1" })
    expect(res.json).toHaveBeenCalledWith(convos)
  })

  test("returns 500 on database error", async () => {
    Conversation.find.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error("DB")) })

    const res = makeRes()
    await conversationController.getConversations(makeReq(), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch conversations" })
  })
})

// ─── getOrCreateConversation ──────────────────────────────────────────────────

describe("getOrCreateConversation", () => {
  test("returns existing conversation if found", async () => {
    const existing = { _id: "conv1", participants: ["user1", "friend1"] }
    Conversation.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(existing) })

    const req = makeReq({ body: { friendId: "friend1" } })
    const res = makeRes()
    await conversationController.getOrCreateConversation(req, res)

    expect(Conversation.findOne).toHaveBeenCalledWith({
      participants: { $all: ["user1", "friend1"], $size: 2 }
    })
    expect(Conversation.create).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(existing)
  })

  test("creates a new conversation if none exists", async () => {
    const newConvo = { _id: "conv2", participants: ["user1", "friend1"], populate: jest.fn().mockResolvedValue({ _id: "conv2" }) }
    Conversation.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) })
    Conversation.create.mockResolvedValue(newConvo)

    const req = makeReq({ body: { friendId: "friend1" } })
    const res = makeRes()
    await conversationController.getOrCreateConversation(req, res)

    expect(Conversation.create).toHaveBeenCalledWith({ participants: ["user1", "friend1"] })
    expect(res.json).toHaveBeenCalledWith({ _id: "conv2" })
  })

  test("returns 500 on error", async () => {
    Conversation.findOne.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error("DB")) })

    const req = makeReq({ body: { friendId: "friend1" } })
    const res = makeRes()
    await conversationController.getOrCreateConversation(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch or create conversation" })
  })
})
