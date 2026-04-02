const mongoose = require("mongoose")
const StudyPlan = require("./StudyPlan");
const Task = require("./Task");

const progressTrackerSchema = new mongoose.Schema({
  // attribute, type
  // progressTrackerID can just be _id property of schema
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  overallcompletion: { type: Number, default: 0 },
  planStats: [{
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan" },
    percentComplete: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
  }],
  totalTasksFinished: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
})

// Update progress for a specific study plan
progressTrackerSchema.methods.updateTaskProgress = async function (studyPlanID) {
  const tasks = await Task.find({ ownerID: this.userID, studyPlanID });

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  // const percent = total === 0 ? 0 : Math.round((completed / total) * 10000 / 100);
  const percent = total === 0? 0 : Number(((this.totalTasksFinished / this.totalTasks) * 100).toFixed(2));

  // Update per-plan stats
  let plan = this.planStats.find(ps => ps.studyPlan.toString() === studyPlanID.toString());
  if (!plan) {
    plan = {
      studyPlan: studyPlanID,
      totalTasks: total,
      completedTasks: completed,
      percentComplete: percent,
    };
    this.planStats.push(plan);
  } else {
    plan.totalTasks = total;
    plan.completedTasks = completed;
    plan.percentComplete = percent;
  }

  // Update overall totals
  this.totalTasks = this.planStats.reduce((sum, p) => sum + p.totalTasks, 0);
  this.totalTasksFinished = this.planStats.reduce((sum, p) => sum + p.completedTasks, 0);

  // Recalculate overall completion
  this.calculateUserScore();

  await this.save();
};

// Overall completion based on all tasks
progressTrackerSchema.methods.calculateUserScore = function () {
  if (this.totalTasks === 0) {
    this.overallcompletion = 0;
    return;
  }
  // this.overallcompletion = Math.round((this.totalTasksFinished / this.totalTasks) * 10000 / 100);
  this.overallcompletion = Number(((this.totalTasksFinished / this.totalTasks) * 100).toFixed(2));
};

module.exports = mongoose.model("ProgressTracker", progressTrackerSchema)