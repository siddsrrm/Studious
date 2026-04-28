const UserAchievement = require("../models/UserAchievement")
const Task = require("../models/Task")
const FriendRequest = require("../models/FriendRequest")
const StudyPlan = require("../models/StudyPlan")
const StudyGroup = require("../models/StudyGroup")
const { emitToUser } = require("../socket")

async function awardIfNew(userId, achievementId) {
  try {
    const doc = await UserAchievement.create({ user: userId, achievementId })
    emitToUser(userId.toString(), "achievement_unlocked", {
      achievementId,
      earnedAt: doc.earnedAt
    })
    console.log(`[Achievement] Awarded ${achievementId} to user ${userId}`)
  } catch (err) {
    if (err.code !== 11000) console.error("[Achievement] Error:", err.message)
    // code 11000 = duplicate key — already earned, silently skip
  }
}

async function checkTaskAchievements(userId) {
  const count = await Task.countDocuments({ ownerID: userId, completed: true })
  if (count >= 5)   await awardIfNew(userId, "complete_5_tasks")
  if (count >= 10)  await awardIfNew(userId, "complete_10_tasks")
  if (count >= 50)  await awardIfNew(userId, "complete_50_tasks")
  if (count >= 100) await awardIfNew(userId, "complete_100_tasks")
}

async function checkFriendAchievements(userId) {
  const count = await FriendRequest.countDocuments({
    $or: [{ sender: userId }, { recipient: userId }],
    status: 1
  })
  if (count >= 1) await awardIfNew(userId, "first_friend")
}

async function checkStudyGroupAchievements(userId) {
  const count = await StudyGroup.countDocuments({ members: userId })
  if (count >= 1) await awardIfNew(userId, "joined_study_group")
}

async function checkStudyPlanAchievements(userId) {
  const count = await StudyPlan.countDocuments({ owner: userId })
  if (count >= 1) await awardIfNew(userId, "first_study_plan")
}

module.exports = { checkTaskAchievements, checkFriendAchievements, checkStudyPlanAchievements, checkStudyGroupAchievements }
