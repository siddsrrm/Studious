const mongoose = require("mongoose")
const StudyPlan = require("./models/StudyPlan")
const ProgressTracker = require("./models/ProgressTracker")

const userSchema = new mongoose.Schema({
  // attribute, type
  // userID can just be _id property of schema
  email: String,
  username: String,
  password: String,
  studyPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan" }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  progressTracker: { type: mongoose.Schema.Types.ObjectId, ref: "ProgressTracker" }
})

userSchema.methods.createStudyPlan = function(title, description) {
  // logic here
}

userSchema.methods.updateAccountSettings(email, password) {
  
}

userSchema.methods.getOverallProgress() {

}

module.exports = mongoose.model("User", userSchema)