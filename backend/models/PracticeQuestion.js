/* Mock Data*/
export async function getPracticeQuestions() {
  return [
    {
      studyPlanId: "1",
      question: "What is React?",
      answer: "A JS library for UI.",
    },
    {
      studyPlanId: "2",
      question: "What is a component?",
      answer: "Reusable UI block.",
    },
  ];
}

/*const mongoose = require("mongoose");

const practiceQuestionSchema = new mongoose.Schema({
  studyPlanID: {  type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true},
  question: {type: String, required: true},
  answer: {type: String, required: true},
}, { timestamps: true });

practiceQuestionSchema.methods.checkAnswer = function() {
  
}

module.exports = mongoose.model("PracticeQuestion", practiceQuestionSchema);*/
