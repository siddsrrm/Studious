const mongoose = require("mongoose")
const StudyPlan = require("./StudyPlan");

const progressTrackerSchema = new mongoose.Schema({
  // attribute, type
  // progressTrackerID can just be _id property of schema
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  overallcompletion: {type: Number, default: 0},
  planStats: [{
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan" },
    percentComplete: { type: Number, default: 0 },
  }],
  totalTasksFinished: {type: Number, default: 0 }

})

progressTrackerSchema.methods.updateTaskProgress = function(studyPlanID) {
  // logic here
}

progressTrackerSchema.methods.calculateUserScore = function() {

}



module.exports = mongoose.model("ProgressTracker", progressTrackerSchema)