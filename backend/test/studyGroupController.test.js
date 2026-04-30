const studyGroupController = require("../controllers/studyGroupController")
const StudyGroup = require("../models/StudyGroup")
const Message = require("../models/Message")
const Note = require("../models/Note")
const User = require("../models/User")

jest.mock("../models/StudyGroup")
jest.mock("../models/Message")
jest.mock("../models/Note")
jest.mock("../models/User")
jest.mock("../socket", () => ({ emitToUser: jest.fn() }))
jest.mock("../services/achievementService", () => ({ checkStudyGroupAchievements: jest.fn() }))

const { emitToUser } = require("../socket")
const { checkStudyGroupAchievements } = require("../services/achievementService")

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

const makeReq = (overrides = {}) => ({
  user: { userId: "owner1" },
  params: {},
  body: {},
  ...overrides,
})

// Shared mock group factory
const makeGroup = (overrides = {}) => ({
  _id: "group1",
  name: "Test Group",
  createdBy: { toString: () => "owner1" },
  members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
  joinRequests: [],
  privacy: "open",
  save: jest.fn().mockResolvedValue(null),
  populate: jest.fn().mockResolvedValue(null),
  ...overrides,
})

beforeEach(() => jest.clearAllMocks())

// ─── createGroup ──────────────────────────────────────────────────────────────

describe("createGroup", () => {
  test("creates group with name and creator as first member", async () => {
    const group = { _id: "group1", name: "Study Crew", members: ["owner1"] }
    StudyGroup.create.mockResolvedValue(group)

    const req = makeReq({ body: { name: "Study Crew" } })
    const res = makeRes()
    await studyGroupController.createGroup(req, res)

    expect(StudyGroup.create).toHaveBeenCalledWith({ name: "Study Crew", createdBy: "owner1", members: ["owner1"] })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(group)
  })

  test("returns 500 on error", async () => {
    StudyGroup.create.mockRejectedValue(new Error("DB error"))

    const res = makeRes()
    await studyGroupController.createGroup(makeReq({ body: { name: "X" } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to create group" })
  })
})

// ─── getGroup ─────────────────────────────────────────────────────────────────

describe("getGroup", () => {
  test("returns group when found", async () => {
    const group = makeGroup()
    StudyGroup.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: undefined,
    })
    // chain: .populate().populate().populate()
    const populateMock = jest.fn().mockReturnThis()
    const finalMock = { ...group }
    StudyGroup.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(finalMock)
        })
      })
    })

    const req = makeReq({ params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.getGroup(req, res)

    expect(res.json).toHaveBeenCalledWith(finalMock)
  })

  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      })
    })

    const req = makeReq({ params: { groupId: "bad" } })
    const res = makeRes()
    await studyGroupController.getGroup(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: "Group not found" })
  })
})

// ─── addMember ────────────────────────────────────────────────────────────────

describe("addMember", () => {
  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "bad" }, body: { userId: "user2" } })
    const res = makeRes()
    await studyGroupController.addMember(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: "Group not found" })
  })

  test("returns 400 when user is already a member", async () => {
    const group = makeGroup({ members: [{ toString: () => "user2" }] })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ params: { groupId: "group1" }, body: { userId: "user2" } })
    const res = makeRes()
    await studyGroupController.addMember(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "User is already a member" })
  })

  test("adds member, emits socket, checks achievement", async () => {
    const newMember = { _id: "user3", toString: () => "user3", username: "carol", avatar: null }
    const existingMember = { _id: "owner1", toString: () => "owner1" }
    const group = makeGroup({
      members: [existingMember],
      populate: jest.fn().mockImplementation(() => {
        group.members = [existingMember, newMember]
        return Promise.resolve()
      }),
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ params: { groupId: "group1" }, body: { userId: "user3" } })
    const res = makeRes()
    await studyGroupController.addMember(req, res)

    expect(group.members).toContain(newMember)
    expect(emitToUser).toHaveBeenCalledWith("owner1", "group_member_joined", expect.objectContaining({ groupId: "group1" }))
    expect(emitToUser).toHaveBeenCalledWith("user3", "group_member_joined", expect.objectContaining({ groupId: "group1" }))
    expect(checkStudyGroupAchievements).toHaveBeenCalledWith("user3")
  })
})

// ─── removeMember ─────────────────────────────────────────────────────────────

describe("removeMember", () => {
  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "bad", userId: "user2" } })
    const res = makeRes()
    await studyGroupController.removeMember(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test("returns 403 when requester is neither owner nor self", async () => {
    const group = makeGroup({ createdBy: { toString: () => "owner1" } })
    StudyGroup.findById.mockResolvedValue(group)

    // user: "someone_else" trying to remove "user2"
    const req = makeReq({ user: { userId: "someone_else" }, params: { groupId: "group1", userId: "user2" } })
    const res = makeRes()
    await studyGroupController.removeMember(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized" })
  })

  test("owner can remove a member", async () => {
    const group = makeGroup({
      createdBy: { toString: () => "owner1" },
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "owner1" }, params: { groupId: "group1", userId: "user2" } })
    const res = makeRes()
    await studyGroupController.removeMember(req, res)

    expect(group.members.map(m => m.toString())).not.toContain("user2")
    expect(group.save).toHaveBeenCalled()
  })

  test("a member can remove themselves (leave)", async () => {
    const group = makeGroup({
      createdBy: { toString: () => "owner1" },
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user2" }, params: { groupId: "group1", userId: "user2" } })
    const res = makeRes()
    await studyGroupController.removeMember(req, res)

    expect(group.members.map(m => m.toString())).not.toContain("user2")
    expect(group.save).toHaveBeenCalled()
  })

  test("emits group_member_removed to all members before removal", async () => {
    const m1 = { toString: () => "owner1" }
    const m2 = { toString: () => "user2" }
    const group = makeGroup({
      createdBy: { toString: () => "owner1" },
      members: [m1, m2],
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "owner1" }, params: { groupId: "group1", userId: "user2" } })
    const res = makeRes()
    await studyGroupController.removeMember(req, res)

    expect(emitToUser).toHaveBeenCalledWith("owner1", "group_member_removed", { groupId: "group1", userId: "user2" })
    expect(emitToUser).toHaveBeenCalledWith("user2", "group_member_removed", { groupId: "group1", userId: "user2" })
  })
})

// ─── deleteGroup ──────────────────────────────────────────────────────────────

describe("deleteGroup", () => {
  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "bad" } })
    const res = makeRes()
    await studyGroupController.deleteGroup(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test("returns 403 when non-owner tries to delete", async () => {
    const group = makeGroup({ createdBy: { toString: () => "owner1" } })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user2" }, params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.deleteGroup(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: "Only the owner can delete the group" })
  })

  test("owner deletes group and cleans up messages and notes", async () => {
    const group = makeGroup()
    StudyGroup.findById.mockResolvedValue(group)
    Message.deleteMany.mockResolvedValue(null)
    Note.updateMany.mockResolvedValue(null)
    StudyGroup.deleteOne.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.deleteGroup(req, res)

    expect(Message.deleteMany).toHaveBeenCalledWith({ groupId: "group1" })
    expect(Note.updateMany).toHaveBeenCalledWith({ groupIds: "group1" }, { $pull: { groupIds: "group1" } })
    expect(StudyGroup.deleteOne).toHaveBeenCalledWith({ _id: "group1" })
    expect(res.json).toHaveBeenCalledWith({ message: "Group deleted" })
  })

  test("emits group_deleted to all members", async () => {
    const group = makeGroup({
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)
    Message.deleteMany.mockResolvedValue(null)
    Note.updateMany.mockResolvedValue(null)
    StudyGroup.deleteOne.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.deleteGroup(req, res)

    expect(emitToUser).toHaveBeenCalledWith("owner1", "group_deleted", { groupId: "group1", groupName: "Test Group" })
    expect(emitToUser).toHaveBeenCalledWith("user2", "group_deleted", { groupId: "group1", groupName: "Test Group" })
  })
})

// ─── updatePrivacy ────────────────────────────────────────────────────────────

describe("updatePrivacy", () => {
  test("returns 400 for invalid privacy value", async () => {
    const req = makeReq({ params: { groupId: "group1" }, body: { privacy: "invite-only" } })
    const res = makeRes()
    await studyGroupController.updatePrivacy(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid privacy value" })
  })

  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "bad" }, body: { privacy: "request" } })
    const res = makeRes()
    await studyGroupController.updatePrivacy(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test("returns 403 when non-owner tries to change privacy", async () => {
    const group = makeGroup({ createdBy: { toString: () => "owner1" } })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user2" }, params: { groupId: "group1" }, body: { privacy: "request" } })
    const res = makeRes()
    await studyGroupController.updatePrivacy(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test("owner can set privacy to 'request'", async () => {
    const group = makeGroup({ privacy: "open" })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ params: { groupId: "group1" }, body: { privacy: "request" } })
    const res = makeRes()
    await studyGroupController.updatePrivacy(req, res)

    expect(group.privacy).toBe("request")
    expect(group.save).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ privacy: "request" })
  })

  test("emits group_privacy_changed to all members", async () => {
    const group = makeGroup({
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ params: { groupId: "group1" }, body: { privacy: "request" } })
    const res = makeRes()
    await studyGroupController.updatePrivacy(req, res)

    expect(emitToUser).toHaveBeenCalledWith("owner1", "group_privacy_changed", { groupId: "group1", privacy: "request" })
    expect(emitToUser).toHaveBeenCalledWith("user2", "group_privacy_changed", { groupId: "group1", privacy: "request" })
  })
})

// ─── requestToJoin ────────────────────────────────────────────────────────────

describe("requestToJoin", () => {
  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockResolvedValue(null)

    const req = makeReq({ user: { userId: "user3" }, params: { groupId: "bad" } })
    const res = makeRes()
    await studyGroupController.requestToJoin(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test("returns 400 when user is already a member", async () => {
    const group = makeGroup({ members: [{ toString: () => "user3" }], privacy: "open" })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user3" }, params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.requestToJoin(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "Already a member" })
  })

  test("open group: auto-joins, checks achievement, returns joined:true", async () => {
    const newUser = { _id: "user3", toString: () => "user3", username: "bob", avatar: null }
    const owner = { _id: "owner1", toString: () => "owner1" }
    const group = makeGroup({
      privacy: "open",
      members: [owner],
      populate: jest.fn().mockImplementation(() => {
        group.members = [owner, newUser]
        return Promise.resolve()
      }),
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user3" }, params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.requestToJoin(req, res)

    expect(group.members.map(m => m.toString())).toContain("user3")
    expect(checkStudyGroupAchievements).toHaveBeenCalledWith("user3")
    expect(res.json).toHaveBeenCalledWith({ message: "Joined", joined: true })
  })

  test("request group: returns 400 if request already sent", async () => {
    const group = makeGroup({
      privacy: "request",
      members: [{ toString: () => "owner1" }],
      joinRequests: [{ toString: () => "user3" }],
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user3" }, params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.requestToJoin(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "Request already sent" })
  })

  test("request group: adds to joinRequests, emits to owner, returns joined:false", async () => {
    const group = makeGroup({
      privacy: "request",
      members: [{ toString: () => "owner1" }],
      joinRequests: [],
      createdBy: { toString: () => "owner1" },
      name: "Test Group",
    })
    StudyGroup.findById.mockResolvedValue(group)
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: "user3", username: "bob", avatar: null }) })

    const req = makeReq({ user: { userId: "user3" }, params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.requestToJoin(req, res)

    expect(group.joinRequests.map(r => r.toString())).toContain("user3")
    expect(emitToUser).toHaveBeenCalledWith("owner1", "group_join_request", expect.objectContaining({
      groupId: "group1",
      groupName: "Test Group",
      user: expect.objectContaining({ username: "bob" }),
    }))
    expect(res.json).toHaveBeenCalledWith({ message: "Request sent", joined: false })
  })
})

// ─── acceptJoinRequest ────────────────────────────────────────────────────────

describe("acceptJoinRequest", () => {
  test("returns 404 when group not found", async () => {
    StudyGroup.findById.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "bad", userId: "user3" } })
    const res = makeRes()
    await studyGroupController.acceptJoinRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test("returns 403 when non-owner tries to accept", async () => {
    const group = makeGroup({ createdBy: { toString: () => "owner1" } })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user2" }, params: { groupId: "group1", userId: "user3" } })
    const res = makeRes()
    await studyGroupController.acceptJoinRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test("moves user from joinRequests to members, checks achievement", async () => {
    const newMember = { _id: "user3", toString: () => "user3", username: "bob", avatar: null }
    const owner = { _id: "owner1", toString: () => "owner1" }
    const group = makeGroup({
      joinRequests: [{ toString: () => "user3" }],
      members: [owner],
      populate: jest.fn().mockImplementation(() => {
        group.members = [owner, newMember]
        group.joinRequests = []
        return Promise.resolve()
      }),
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ params: { groupId: "group1", userId: "user3" } })
    const res = makeRes()
    await studyGroupController.acceptJoinRequest(req, res)

    expect(group.joinRequests.map(r => r.toString())).not.toContain("user3")
    expect(checkStudyGroupAchievements).toHaveBeenCalledWith("user3")
    expect(emitToUser).toHaveBeenCalledWith("user3", "group_request_accepted", { groupId: "group1", groupName: "Test Group" })
  })
})

// ─── declineJoinRequest ───────────────────────────────────────────────────────

describe("declineJoinRequest", () => {
  test("returns 403 when non-owner tries to decline", async () => {
    const group = makeGroup({ createdBy: { toString: () => "owner1" } })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "user2" }, params: { groupId: "group1", userId: "user3" } })
    const res = makeRes()
    await studyGroupController.declineJoinRequest(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test("removes request and emits declined to user", async () => {
    const group = makeGroup({
      joinRequests: [{ toString: () => "user3" }],
      createdBy: { toString: () => "owner1" },
      name: "Test Group",
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ params: { groupId: "group1", userId: "user3" } })
    const res = makeRes()
    await studyGroupController.declineJoinRequest(req, res)

    expect(group.joinRequests.map(r => r.toString())).not.toContain("user3")
    expect(emitToUser).toHaveBeenCalledWith("user3", "group_request_declined", { groupId: "group1", groupName: "Test Group" })
    expect(res.json).toHaveBeenCalledWith({ message: "Request declined" })
  })
})

// ─── group messages ───────────────────────────────────────────────────────────

describe("getMessages (group)", () => {
  test("returns messages for the group", async () => {
    const msgs = [{ _id: "m1", content: "hi" }]
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(msgs) })
    })

    const req = makeReq({ params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.getMessages(req, res)

    expect(Message.find).toHaveBeenCalledWith({ groupId: "group1" })
    expect(res.json).toHaveBeenCalledWith(msgs)
  })

  test("returns 500 on error", async () => {
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error("DB")) })
    })

    const res = makeRes()
    await studyGroupController.getMessages(makeReq({ params: { groupId: "group1" } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe("sendMessage (group)", () => {
  test("creates message and emits to all members except sender", async () => {
    const msg = { _id: "m1", content: "yo", createdAt: new Date() }
    Message.create.mockResolvedValue(msg)
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ username: "alice" }) })
    const group = makeGroup({
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "owner1" }, params: { groupId: "group1" }, body: { content: "yo" } })
    const res = makeRes()
    await studyGroupController.sendMessage(req, res)

    expect(Message.create).toHaveBeenCalledWith({ groupId: "group1", senderId: "owner1", content: "yo" })
    expect(emitToUser).toHaveBeenCalledWith("user2", "group_message_received", expect.objectContaining({
      content: "yo",
      senderUsername: "alice",
    }))
    expect(emitToUser).not.toHaveBeenCalledWith("owner1", "group_message_received", expect.anything())
    expect(res.json).toHaveBeenCalledWith(msg)
  })
})

// ─── group notes ──────────────────────────────────────────────────────────────

describe("getGroupNotes", () => {
  test("returns notes belonging to the group", async () => {
    const notes = [{ _id: "n1", title: "Bio" }]
    Note.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(notes) })

    const req = makeReq({ params: { groupId: "group1" } })
    const res = makeRes()
    await studyGroupController.getGroupNotes(req, res)

    expect(Note.find).toHaveBeenCalledWith({ groupIds: "group1" })
    expect(res.json).toHaveBeenCalledWith(notes)
  })
})

describe("createGroupNote", () => {
  test("returns 403 when user is not a member", async () => {
    const group = makeGroup({ members: [{ toString: () => "owner1" }] })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "outsider" }, params: { groupId: "group1" }, body: { noteId: "note1" } })
    const res = makeRes()
    await studyGroupController.createGroupNote(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test("adds groupId to note and emits to other members", async () => {
    const group = makeGroup({
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)
    const note = { _id: "note1", title: "Bio", ownerID: { username: "alice" } }
    Note.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(note) })

    const req = makeReq({ params: { groupId: "group1" }, body: { noteId: "note1" } })
    const res = makeRes()
    await studyGroupController.createGroupNote(req, res)

    expect(Note.findByIdAndUpdate).toHaveBeenCalledWith("note1", { $addToSet: { groupIds: "group1" } }, { new: true })
    expect(emitToUser).toHaveBeenCalledWith("user2", "group_note_shared", expect.objectContaining({ groupId: "group1" }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test("returns 404 when note not found", async () => {
    const group = makeGroup({ members: [{ toString: () => "owner1" }] })
    StudyGroup.findById.mockResolvedValue(group)
    Note.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) })

    const req = makeReq({ params: { groupId: "group1" }, body: { noteId: "bad" } })
    const res = makeRes()
    await studyGroupController.createGroupNote(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe("deleteGroupNote", () => {
  test("returns 403 when user is not a member", async () => {
    const group = makeGroup({ members: [{ toString: () => "owner1" }] })
    StudyGroup.findById.mockResolvedValue(group)

    const req = makeReq({ user: { userId: "outsider" }, params: { groupId: "group1", noteId: "note1" } })
    const res = makeRes()
    await studyGroupController.deleteGroupNote(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test("removes groupId from note and emits to other members", async () => {
    const group = makeGroup({
      _id: "group1",
      members: [{ toString: () => "owner1" }, { toString: () => "user2" }],
    })
    StudyGroup.findById.mockResolvedValue(group)
    Note.findByIdAndUpdate.mockResolvedValue(null)

    const req = makeReq({ params: { groupId: "group1", noteId: "note1" } })
    const res = makeRes()
    await studyGroupController.deleteGroupNote(req, res)

    expect(Note.findByIdAndUpdate).toHaveBeenCalledWith("note1", { $pull: { groupIds: group._id } })
    expect(emitToUser).toHaveBeenCalledWith("user2", "group_note_removed", { groupId: "group1", noteId: "note1" })
    expect(res.json).toHaveBeenCalledWith({ message: "Note removed from group" })
  })
})
