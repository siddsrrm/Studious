const mongoose = require("mongoose")

const leaderboardSchema = new mongoose.Schema({
  // attribute, type
  // leaderboardID can just be _id property of schema
  userRankings: [
    {
      userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      score: Number // overall completion % (0-100)
    }
  ],
  lastRefreshTime: Date
})

leaderboardSchema.methods.recalculateRankings = function () {
  this.userRankings.sort((a, b) => b.score - a.score);
  this.lastRefreshTime = new Date();
  return this.save();
}

leaderboardSchema.methods.updateUserScore = function (userID, score) {
  const existing = this.userRankings.find(r => r.userID.toString() === userID.toString());
  if (existing) {
    existing.score = score;
  } else {
    this.userRankings.push({ userID, score });
  }
  return this.save();
}

leaderboardSchema.methods.getTopUsers = function (limit = 10) {
  return [...this.userRankings]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      userID: entry.userID,
      username: entry.username,
      score: entry.score,
    }));
}

module.exports = mongoose.model("Leaderboard", leaderboardSchema)