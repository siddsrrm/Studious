const mongoose = require("mongoose");

const gradeEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["assignment", "project", "exam"],
    required: true,
  },
  score: { type: Number, required: true, min: 0, max: 100 },
  weight: { type: Number, default: null, min: 0, max: 100 },
  dueDate: { type: Date, default: null },
  notes: { type: String, default: "" },
});

const gradeBookSchema = new mongoose.Schema({
  studyPlanID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
    required: true,
    unique: true,
  },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  entries: [gradeEntrySchema],
});

//calculates overall grade. weighted if all entries have weights, simple average otherwise
gradeBookSchema.methods.calculateOverallGrade = function () {
  if (this.entries.length === 0) return null;

  const hasWeights = this.entries.every(
    (e) => e.weight !== null && e.weight !== undefined,
  );

  if (hasWeights) {
    const totalWeight = this.entries.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight === 0) return null;
    const weighted = this.entries.reduce(
      (sum, e) => sum + e.score * e.weight,
      0,
    );
    return Math.round((weighted / totalWeight) * 100) / 100;
  }

  const total = this.entries.reduce((sum, e) => sum + e.score, 0);
  return Math.round((total / this.entries.length) * 100) / 100;
};

module.exports = mongoose.model("GradeBook", gradeBookSchema);
