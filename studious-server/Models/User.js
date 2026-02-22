const mongoose = require("mongoose")
const StudyPlan = require("./models/StudyPlan")
const ProgressTracker = require("./models/ProgressTracker")

const userSchema = new mongoose.Schema({
  // attribute, type
  userID: Number,
  email: String,
  username: String,
  password: String,
  studyPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan" }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  progressTracker: { type: mongoose.Schema.Types.ObjectId, ref: "ProgressTracker" }
})

module.exports = mongoose.model("User", userSchema)