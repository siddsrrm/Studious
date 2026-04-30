const UserAchievement = require("../models/UserAchievement")
const Task = require("../models/Task")
const FriendRequest = require("../models/FriendRequest")
const StudyPlan = require("../models/StudyPlan")

jest.mock("../models/UserAchievement")
jest.mock("../models/Task")
jest.mock("../models/FriendRequest")
jest.mock("../models/StudyPlan")
jest.mock("../socket", () => ({ emitToUser: jest.fn() }))

const { emitToUser } = require("../socket")
const {
  checkTaskAchievements,
  checkFriendAchievements,
  checkStudyPlanAchievements,
} = require("../services/achievementService")

const USER_ID = "user123"

beforeEach(() => {
  jest.clearAllMocks()
})

describe("checkTaskAchievements", () => {
  test("awards no achievements when completed task count is below 5", async () => {
    Task.countDocuments.mockResolvedValue(3)
    await checkTaskAchievements(USER_ID)
    expect(UserAchievement.create).not.toHaveBeenCalled()
  })

  test("awards complete_5_tasks when count reaches 5", async () => {
    Task.countDocuments.mockResolvedValue(5)
    UserAchievement.create.mockResolvedValue({ achievementId: "complete_5_tasks", earnedAt: new Date() })
    await checkTaskAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledWith(
      expect.objectContaining({ achievementId: "complete_5_tasks" })
    )
    expect(UserAchievement.create).toHaveBeenCalledTimes(1)
  })

  test("awards complete_5_tasks and complete_10_tasks when count is 10", async () => {
    Task.countDocuments.mockResolvedValue(10)
    UserAchievement.create.mockResolvedValue({ achievementId: "complete_10_tasks", earnedAt: new Date() })
    await checkTaskAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledTimes(2)
    const ids = UserAchievement.create.mock.calls.map(c => c[0].achievementId)
    expect(ids).toContain("complete_5_tasks")
    expect(ids).toContain("complete_10_tasks")
  })

  test("awards all four task achievements when count reaches 100", async () => {
    Task.countDocuments.mockResolvedValue(100)
    UserAchievement.create.mockResolvedValue({ earnedAt: new Date() })
    await checkTaskAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledTimes(4)
    const ids = UserAchievement.create.mock.calls.map(c => c[0].achievementId)
    expect(ids).toContain("complete_5_tasks")
    expect(ids).toContain("complete_10_tasks")
    expect(ids).toContain("complete_50_tasks")
    expect(ids).toContain("complete_100_tasks")
  })

  test("emits achievement_unlocked socket event when awarded", async () => {
    Task.countDocuments.mockResolvedValue(5)
    const earnedAt = new Date()
    UserAchievement.create.mockResolvedValue({ achievementId: "complete_5_tasks", earnedAt })
    await checkTaskAchievements(USER_ID)
    expect(emitToUser).toHaveBeenCalledWith(
      USER_ID.toString(),
      "achievement_unlocked",
      { achievementId: "complete_5_tasks", earnedAt }
    )
  })

  test("silently skips duplicate award (error code 11000)", async () => {
    Task.countDocuments.mockResolvedValue(5)
    const dupError = new Error("Duplicate key")
    dupError.code = 11000
    UserAchievement.create.mockRejectedValue(dupError)
    await expect(checkTaskAchievements(USER_ID)).resolves.not.toThrow()
    expect(emitToUser).not.toHaveBeenCalled()
  })
})

describe("checkFriendAchievements", () => {
  test("awards no achievements when user has no friends", async () => {
    FriendRequest.countDocuments.mockResolvedValue(0)
    await checkFriendAchievements(USER_ID)
    expect(UserAchievement.create).not.toHaveBeenCalled()
  })

  test("awards first_friend when friend count reaches 1", async () => {
    FriendRequest.countDocuments.mockResolvedValue(1)
    UserAchievement.create.mockResolvedValue({ achievementId: "first_friend", earnedAt: new Date() })
    await checkFriendAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledWith(
      expect.objectContaining({ achievementId: "first_friend" })
    )
    expect(UserAchievement.create).toHaveBeenCalledTimes(1)
  })

  test("awards only first_friend when friend count reaches 2 (joined_study_group is separate)", async () => {
    FriendRequest.countDocuments.mockResolvedValue(2)
    UserAchievement.create.mockResolvedValue({ earnedAt: new Date() })
    await checkFriendAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledTimes(1)
    const ids = UserAchievement.create.mock.calls.map(c => c[0].achievementId)
    expect(ids).toContain("first_friend")
    expect(ids).not.toContain("joined_study_group")
  })

  test("queries using both sender and recipient fields with status 1", async () => {
    FriendRequest.countDocuments.mockResolvedValue(0)
    await checkFriendAchievements(USER_ID)
    expect(FriendRequest.countDocuments).toHaveBeenCalledWith({
      $or: [{ sender: USER_ID }, { recipient: USER_ID }],
      status: 1
    })
  })

  test("silently skips duplicate award (error code 11000)", async () => {
    FriendRequest.countDocuments.mockResolvedValue(1)
    const dupError = new Error("Duplicate key")
    dupError.code = 11000
    UserAchievement.create.mockRejectedValue(dupError)
    await expect(checkFriendAchievements(USER_ID)).resolves.not.toThrow()
  })
})

describe("checkStudyPlanAchievements", () => {
  test("awards no achievements when user has no study plans", async () => {
    StudyPlan.countDocuments.mockResolvedValue(0)
    await checkStudyPlanAchievements(USER_ID)
    expect(UserAchievement.create).not.toHaveBeenCalled()
  })

  test("awards first_study_plan when user creates their first plan", async () => {
    StudyPlan.countDocuments.mockResolvedValue(1)
    UserAchievement.create.mockResolvedValue({ achievementId: "first_study_plan", earnedAt: new Date() })
    await checkStudyPlanAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledWith(
      expect.objectContaining({ achievementId: "first_study_plan" })
    )
    expect(UserAchievement.create).toHaveBeenCalledTimes(1)
  })

  test("awards first_study_plan only once even with multiple plans", async () => {
    StudyPlan.countDocuments.mockResolvedValue(5)
    UserAchievement.create.mockResolvedValue({ achievementId: "first_study_plan", earnedAt: new Date() })
    await checkStudyPlanAchievements(USER_ID)
    expect(UserAchievement.create).toHaveBeenCalledTimes(1)
  })

  test("emits achievement_unlocked socket event when awarded", async () => {
    StudyPlan.countDocuments.mockResolvedValue(1)
    const earnedAt = new Date()
    UserAchievement.create.mockResolvedValue({ achievementId: "first_study_plan", earnedAt })
    await checkStudyPlanAchievements(USER_ID)
    expect(emitToUser).toHaveBeenCalledWith(
      USER_ID.toString(),
      "achievement_unlocked",
      { achievementId: "first_study_plan", earnedAt }
    )
  })

  test("silently skips duplicate award (error code 11000)", async () => {
    StudyPlan.countDocuments.mockResolvedValue(1)
    const dupError = new Error("Duplicate key")
    dupError.code = 11000
    UserAchievement.create.mockRejectedValue(dupError)
    await expect(checkStudyPlanAchievements(USER_ID)).resolves.not.toThrow()
    expect(emitToUser).not.toHaveBeenCalled()
  })
})
