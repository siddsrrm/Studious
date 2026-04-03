const friendRequestController = require("../controllers/friendRequestController")
const FriendRequest = require("../models/FriendRequest")

jest.mock("../models/FriendRequest")
jest.mock("../models/User")
jest.mock("../socket", () => ({
  emitToUser: jest.fn(),
}))

const { emitToUser } = require("../socket")

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

const USER_ID = "user123"

function makeReq(overrides = {}) {
  return {
    user: { userId: USER_ID },
    body: {},
    params: {},
    ...overrides,
  }
}

describe("sendRequest", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns 400 when sending request to self", async () => {
    const req = makeReq({ body: { recipientId: USER_ID } })

    await friendRequestController.sendRequest(req, res)

    expect(FriendRequest.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "Cannot send a friend request to yourself" })
  })

  test("returns 400 when duplicate pending/accepted request exists", async () => {
    const req = makeReq({ body: { recipientId: "user456" } })
    FriendRequest.findOne.mockResolvedValue({ _id: "existingReq" })

    await friendRequestController.sendRequest(req, res)

    expect(FriendRequest.findOne).toHaveBeenCalledWith({
      sender: USER_ID,
      recipient: "user456",
      status: { $in: [0, 1] },
    })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request already sent" })
  })

  test("creates and returns populated friend request on success", async () => {
    const req = makeReq({ body: { recipientId: "user456" } })
    const created = { _id: "req1" }
    const populated = {
      _id: "req1",
      sender: { _id: USER_ID, username: "jpbarath", avatar: "/avatars/avatar1.png" },
      recipient: { _id: "user456", username: "user", avatar: "/avatars/avatar2.png" },
    }

    FriendRequest.findOne.mockResolvedValue(null)
    FriendRequest.create.mockResolvedValue(created)
    FriendRequest.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(populated),
    })

    await friendRequestController.sendRequest(req, res)

    expect(FriendRequest.create).toHaveBeenCalledWith({ sender: USER_ID, recipient: "user456", status: 0 })
    expect(emitToUser).toHaveBeenCalledWith(
      "user456",
      "friend_request_received",
      populated,
      expect.stringContaining("sent a friend request")
    )
    expect(res.json).toHaveBeenCalledWith(populated)
  })

  test("returns 500 on server error", async () => {
    const req = makeReq({ body: { recipientId: "user456" } })
    FriendRequest.findOne.mockRejectedValue(new Error("DB error"))

    await friendRequestController.sendRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to send friend request" })
  })
})

describe("respondRequest", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns 404 when request is not found", async () => {
    const req = makeReq({ params: { requestId: "req1" }, body: { status: 1 } })
    FriendRequest.findById.mockResolvedValue(null)

    await friendRequestController.respondRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request not found" })
  })

  test("returns 403 when current user is not recipient", async () => {
    const req = makeReq({ params: { requestId: "req1" }, body: { status: 1 } })
    FriendRequest.findById.mockResolvedValue({ recipient: { toString: () => "other" } })

    await friendRequestController.respondRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized to respond to this request" })
  })

  test("accepts request and emits friend_request_accepted", async () => {
    const req = makeReq({ params: { requestId: "req1" }, body: { status: 1 } })
    const fRequest = {
      _id: "req1",
      sender: { toString: () => "user456" },
      recipient: { toString: () => USER_ID },
      save: jest.fn().mockResolvedValue({}),
    }
    const populated = {
      _id: "req1",
      sender: { username: "user" },
      recipient: { username: "jpbarath" },
    }

    FriendRequest.findById
      .mockResolvedValueOnce(fRequest)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(populated) })

    await friendRequestController.respondRequest(req, res)

    expect(fRequest.status).toBe(1)
    expect(fRequest.save).toHaveBeenCalledTimes(1)
    expect(emitToUser).toHaveBeenCalledWith(
      "user456",
      "friend_request_accepted",
      populated,
      expect.stringContaining("accepted")
    )
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request accepted" })
  })

  test("declines request, deletes it, and emits friend_request_declined", async () => {
    const req = makeReq({ params: { requestId: "req1" }, body: { status: 2 } })
    const fRequest = {
      _id: "req1",
      sender: { toString: () => "user456" },
      recipient: { toString: () => USER_ID },
      save: jest.fn().mockResolvedValue({}),
    }
    const populated = {
      _id: "req1",
      sender: { username: "user" },
      recipient: { username: "jpbarath" },
    }

    FriendRequest.findById
      .mockResolvedValueOnce(fRequest)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(populated) })
    FriendRequest.deleteOne.mockResolvedValue({ deletedCount: 1 })

    await friendRequestController.respondRequest(req, res)

    expect(FriendRequest.deleteOne).toHaveBeenCalledWith({ _id: "req1" })
    expect(emitToUser).toHaveBeenCalledWith(
      "user456",
      "friend_request_declined",
      { requestId: "req1" },
      expect.stringContaining("declined")
    )
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request declined" })
  })
})

describe("getSentRequests", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns only sent requests with populated recipient", async () => {
    const req = makeReq()
    const rows = [{ _id: "r1", recipient: { _id: "u1" } }, { _id: "r2", recipient: null }]

    FriendRequest.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(rows),
    })

    await friendRequestController.getSentRequests(req, res)

    expect(res.json).toHaveBeenCalledWith([{ _id: "r1", recipient: { _id: "u1" } }])
  })

  test("returns 500 on server error", async () => {
    const req = makeReq()
    FriendRequest.find.mockImplementation(() => {
      throw new Error("DB error")
    })

    await friendRequestController.getSentRequests(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch sent friend requests" })
  })
})

describe("getPendingRequests", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns only pending requests with populated sender", async () => {
    const req = makeReq()
    const rows = [{ _id: "r1", sender: { _id: "u1" } }, { _id: "r2", sender: null }]

    FriendRequest.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(rows),
    })

    await friendRequestController.getPendingRequests(req, res)

    expect(res.json).toHaveBeenCalledWith([{ _id: "r1", sender: { _id: "u1" } }])
  })
})

describe("cancelRequest", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns 404 when request is not found", async () => {
    const req = makeReq({ params: { requestId: "req1" } })
    FriendRequest.findById.mockResolvedValue(null)

    await friendRequestController.cancelRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request not found" })
  })

  test("returns 403 when current user is not sender", async () => {
    const req = makeReq({ params: { requestId: "req1" } })
    FriendRequest.findById.mockResolvedValue({ sender: { toString: () => "other" } })

    await friendRequestController.cancelRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized to cancel friend request" })
  })

  test("cancels request and emits friend_request_cancelled", async () => {
    const req = makeReq({ params: { requestId: "req1" } })
    const fRequest = {
      _id: "req1",
      sender: { toString: () => USER_ID },
      recipient: { toString: () => "user456" },
    }
    const populated = {
      sender: { username: "jpbarath" },
      recipient: { username: "user" },
    }

    FriendRequest.findById
      .mockResolvedValueOnce(fRequest)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(populated) })
    FriendRequest.deleteOne.mockResolvedValue({ deletedCount: 1 })

    await friendRequestController.cancelRequest(req, res)

    expect(FriendRequest.deleteOne).toHaveBeenCalledWith({ _id: "req1" })
    expect(emitToUser).toHaveBeenCalledWith(
      "user456",
      "friend_request_cancelled",
      { requestId: "req1" },
      expect.stringContaining("cancelled")
    )
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request cancelled successfully" })
  })
})

describe("unfriend", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns 404 when request is not found", async () => {
    const req = makeReq({ params: { requestId: "req1" } })
    FriendRequest.findById.mockResolvedValue(null)

    await friendRequestController.unfriend(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: "Friend request not found" })
  })

  test("returns 403 when user is not part of friendship", async () => {
    const req = makeReq({ params: { requestId: "req1" } })
    FriendRequest.findById.mockResolvedValue({
      sender: { toString: () => "a" },
      recipient: { toString: () => "b" },
    })

    await friendRequestController.unfriend(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized" })
  })

  test("unfriends and emits unfriended event", async () => {
    const req = makeReq({ params: { requestId: "req1" } })
    const fRequest = {
      _id: "req1",
      sender: { toString: () => USER_ID },
      recipient: { toString: () => "user456" },
    }
    const populated = {
      sender: { username: "jpbarath" },
      recipient: { username: "user" },
    }

    FriendRequest.findById
      .mockResolvedValueOnce(fRequest)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(populated) })
    FriendRequest.deleteOne.mockResolvedValue({ deletedCount: 1 })

    await friendRequestController.unfriend(req, res)

    expect(emitToUser).toHaveBeenCalledWith(
      "user456",
      "unfriended",
      { requestId: "req1", actorName: "jpbarath" },
      expect.stringContaining("unfriended")
    )
    expect(res.json).toHaveBeenCalledWith({ message: "Unfriended successfully" })
  })
})

describe("getFriends", () => {
  let res

  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns only friend rows with both populated sender and recipient", async () => {
    const req = makeReq()
    const rows = [
      { _id: "f1", sender: { _id: "a" }, recipient: { _id: "b" } },
      { _id: "f2", sender: null, recipient: { _id: "b" } },
      { _id: "f3", sender: { _id: "a" }, recipient: null },
    ]

    FriendRequest.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(rows),
    })

    await friendRequestController.getFriends(req, res)

    expect(FriendRequest.find).toHaveBeenCalledWith({
      $or: [{ sender: USER_ID }, { recipient: USER_ID }],
      status: 1,
    })
    expect(res.json).toHaveBeenCalledWith([{ _id: "f1", sender: { _id: "a" }, recipient: { _id: "b" } }])
  })

  test("returns 500 on server error", async () => {
    const req = makeReq()
    FriendRequest.find.mockImplementation(() => {
      throw new Error("DB error")
    })

    await friendRequestController.getFriends(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch friends list" })
  })
})
