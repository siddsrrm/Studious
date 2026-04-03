const achievementController = require("../controllers/achievementController")
const UserAchievement = require("../models/UserAchievement")
const { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_MAP } = require("../config/achievementDefinitions")

jest.mock("../models/UserAchievement")

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

const USER_ID = "user123"
const OTHER_USER_ID = "user456"

// ------------------- getDefinitions -------------------
describe("getDefinitions", () => {
  test("returns all achievement definitions without auth", () => {
    const res = makeRes()
    achievementController.getDefinitions({}, res)
    expect(res.json).toHaveBeenCalledWith(ACHIEVEMENT_DEFINITIONS)
  })

  test("returns 7 achievements", () => {
    const res = makeRes()
    achievementController.getDefinitions({}, res)
    const [definitions] = res.json.mock.calls[0]
    expect(definitions).toHaveLength(7)
  })

  test("each definition has id, name, description, and badge", () => {
    const res = makeRes()
    achievementController.getDefinitions({}, res)
    const [definitions] = res.json.mock.calls[0]
    definitions.forEach(def => {
      expect(def).toHaveProperty("id")
      expect(def).toHaveProperty("name")
      expect(def).toHaveProperty("description")
      expect(def).toHaveProperty("badge")
    })
  })
})

// ------------------- getMyAchievements -------------------
describe("getMyAchievements", () => {
  let res
  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns earned achievements enriched with name, description, and badge", async () => {
    const earnedAt = new Date("2025-01-01")
    UserAchievement.find.mockResolvedValue([
      { achievementId: "complete_5_tasks", earnedAt },
      { achievementId: "first_friend", earnedAt },
    ])
    const req = { user: { userId: USER_ID } }
    await achievementController.getMyAchievements(req, res)
    expect(UserAchievement.find).toHaveBeenCalledWith({ user: USER_ID })
    const [result] = res.json.mock.calls[0]
    expect(result[0]).toMatchObject({
      achievementId: "complete_5_tasks",
      earnedAt,
      ...ACHIEVEMENT_MAP["complete_5_tasks"]
    })
    expect(result[1]).toMatchObject({
      achievementId: "first_friend",
      earnedAt,
      ...ACHIEVEMENT_MAP["first_friend"]
    })
  })

  test("returns empty array when user has no achievements", async () => {
    UserAchievement.find.mockResolvedValue([])
    const req = { user: { userId: USER_ID } }
    await achievementController.getMyAchievements(req, res)
    expect(res.json).toHaveBeenCalledWith([])
  })

  test("enriched response includes badge filename from definitions", async () => {
    UserAchievement.find.mockResolvedValue([
      { achievementId: "first_study_plan", earnedAt: new Date() }
    ])
    const req = { user: { userId: USER_ID } }
    await achievementController.getMyAchievements(req, res)
    const [result] = res.json.mock.calls[0]
    expect(result[0].badge).toBe(ACHIEVEMENT_MAP["first_study_plan"].badge)
  })

  test("returns 500 on database error", async () => {
    UserAchievement.find.mockRejectedValue(new Error("DB error"))
    const req = { user: { userId: USER_ID } }
    await achievementController.getMyAchievements(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch achievements" })
  })
})

// ------------------- getUserAchievements -------------------
describe("getUserAchievements", () => {
  let res
  beforeEach(() => {
    res = makeRes()
    jest.clearAllMocks()
  })

  test("returns another user's earned achievements enriched with name, description, and badge", async () => {
    const earnedAt = new Date("2025-03-10")
    UserAchievement.find.mockResolvedValue([
      { achievementId: "first_study_plan", earnedAt }
    ])
    const req = { user: { userId: USER_ID }, params: { userId: OTHER_USER_ID } }
    await achievementController.getUserAchievements(req, res)
    expect(UserAchievement.find).toHaveBeenCalledWith({ user: OTHER_USER_ID })
    const [result] = res.json.mock.calls[0]
    expect(result[0]).toMatchObject({
      achievementId: "first_study_plan",
      earnedAt,
      ...ACHIEVEMENT_MAP["first_study_plan"]
    })
  })

  test("returns empty array when the target user has no achievements", async () => {
    UserAchievement.find.mockResolvedValue([])
    const req = { user: { userId: USER_ID }, params: { userId: OTHER_USER_ID } }
    await achievementController.getUserAchievements(req, res)
    expect(res.json).toHaveBeenCalledWith([])
  })

  test("uses userId param not the authenticated user's id", async () => {
    UserAchievement.find.mockResolvedValue([])
    const req = { user: { userId: USER_ID }, params: { userId: OTHER_USER_ID } }
    await achievementController.getUserAchievements(req, res)
    expect(UserAchievement.find).toHaveBeenCalledWith({ user: OTHER_USER_ID })
    expect(UserAchievement.find).not.toHaveBeenCalledWith({ user: USER_ID })
  })

  test("returns 500 on database error", async () => {
    UserAchievement.find.mockRejectedValue(new Error("DB error"))
    const req = { user: { userId: USER_ID }, params: { userId: OTHER_USER_ID } }
    await achievementController.getUserAchievements(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch achievements" })
  })
})
