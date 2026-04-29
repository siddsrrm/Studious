const mongoose = require("mongoose");

const practiceQuestionSchema = new mongoose.Schema({
  ownerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studyPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
    required: true,
  },
  // Mastery tracking
  attempts: {
    type: Number,
    default: 0,
  },
  correctAttempts: {
    type: Number,
    default: 0,
  },
  lastAttemptedAt: {
    type: Date,
    default: null,
  },
  questionType: {
    type: String,
    enum: ["multiple-choice", "free-response"],
    default: "free-response",
  },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  options: [String], // For multiple choice questions
  generatedFromNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
  },

  // Soft-delete flag: hidden questions should not appear in the main UI list,
  // but they remain in the database and are still eligible for mastery tests.
  hidden: {
    type: Boolean,
    default: false,
  },
});

practiceQuestionSchema.methods.updatePracticeQuestion = async function (
  updates,
) {
  const allowed = ["question", "answer", "questionType", "options"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) this[field] = updates[field];
  });
  await this.save();
  return this;
};

module.exports = mongoose.model("PracticeQuestion", practiceQuestionSchema);
