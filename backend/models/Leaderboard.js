const mongoose = require("mongoose")

const leaderboardSchema = new mongoose.Schema({
  // attribute, type
  // leaderboardID can just be _id property of schema
  userRankings: [
    {
      userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      score: Number
    }
  ],
  lastRefreshTime: Date
})

leaderboardSchema.methods.recalculateRankings = function() {
  // logic here
}

leaderboardSchema.methods.updateUserScore = function(userID, score) {

}

leaderboardSchema.methods.getTopUsers = function(limit) {

}

module.exports = mongoose.model("Leaderboard", leaderboardSchema)