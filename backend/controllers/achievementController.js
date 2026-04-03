const UserAchievement = require("../models/UserAchievement")
const { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_MAP } = require("../config/achievementDefinitions")

function enrich(earned) {
  return earned.map(e => ({
    achievementId: e.achievementId,
    earnedAt: e.earnedAt,
    ...(ACHIEVEMENT_MAP[e.achievementId] || {})
  }))
}

exports.getDefinitions = (req, res) => {
  res.json(ACHIEVEMENT_DEFINITIONS)
}

exports.getMyAchievements = async (req, res) => {
  try {
    const earned = await UserAchievement.find({ user: req.user.userId })
    res.json(enrich(earned))
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch achievements" })
  }
}

exports.getUserAchievements = async (req, res) => {
  try {
    const earned = await UserAchievement.find({ user: req.params.userId })
    res.json(enrich(earned))
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch achievements" })
  }
}
