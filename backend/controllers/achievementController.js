const UserAchievement = require("../models/UserAchievement")

exports.getMyAchievements = async (req, res) => {
  try {
    const earned = await UserAchievement.find({ user: req.user.userId })
    res.json(earned)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch achievements" })
  }
}

exports.getUserAchievements = async (req, res) => {
  try {
    const earned = await UserAchievement.find({ user: req.params.userId })
    res.json(earned)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch achievements" })
  }
}
