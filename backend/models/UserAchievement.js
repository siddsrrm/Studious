const mongoose = require("mongoose")

const userAchievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  achievementId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now }
})

userAchievementSchema.index({ user: 1, achievementId: 1 }, { unique: true })

module.exports = mongoose.model("UserAchievement", userAchievementSchema)
