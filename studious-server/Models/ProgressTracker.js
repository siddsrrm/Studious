const mongoose = require("mongoose")

const progressTrackerSchema = new mongoose.Schema({
  // attribute, type
  // progressTrackerID can just be _id property of schema
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  completion: Number
})

progressTrackerSchema.methods.updateTaskProgress = function(studyPlanID) {
  // logic here
}

progressTrackerSchema.methods.calculateUserScore() = function() {

}



module.exports = mongoose.model("ProgressTracker", progressTrackerSchema)