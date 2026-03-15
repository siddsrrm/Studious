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
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

practiceQuestionSchema.methods.updatePracticeQuestions = async function (
  updates,
) {
  const allowed = ["question", "answer"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) this[field] = updates[field];
  });
  await this.save();
  return this;
};

module.exports = mongoose.model("PracticeQuestion", practiceQuestionSchema);
