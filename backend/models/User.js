const mongoose = require("mongoose")
const StudyPlan = require("./StudyPlan")
const ProgressTracker = require("./ProgressTracker")

const userSchema = new mongoose.Schema({
  // attribute, type
  // userID can just be _id property of schema
  email: {type: String, required: true},
  username: {type: String, required: true},
  password: {type: String, required: true},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  progressTracker: { type: mongoose.Schema.Types.ObjectId, ref: "ProgressTracker" }
})

userSchema.methods.createStudyPlan = function(title, description) {
  // logic here
}

userSchema.methods.updateAccountSettings = function(email, password) {
  
}

userSchema.methods.getOverallProgress = function() {

}

module.exports = mongoose.model("User", userSchema)