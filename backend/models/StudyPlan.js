const mongoose = require("mongoose");
const milestoneSchema = require("./Milestone.js");

const studyPlanSchema = new mongoose.Schema({
  // attribute, type
  // studyplanID can just be _id property of schema
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  description: String,
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  practiceQuestions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "PracticeQuestion" },
  ],
  milestones: [milestoneSchema],
  creditHours: { type: Number, default: null },
  workload: { type: Number, default: null },
});

studyPlanSchema.methods.addPracticeQuestion = function (questionData) {
  //logic TBD once we implement AI question generation
};

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
