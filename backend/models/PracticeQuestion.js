const mongoose = require("mongoose");

const practiceQuestionSchema = new mongoose.Schema({
  studyPlanID: {  type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true},
  question: {type: String, required: true},
  answer: {type: String, required: true},
}, { timestamps: true });

practiceQuestionSchema.methods.checkAnswer = function() {
  
}

module.exports = mongoose.model("PracticeQuestion", practiceQuestionSchema);