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
  const percent = total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2));

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

// Full recalculation (e.g. after task deletion or bulk updates)
progressTrackerSchema.methods.recalculateAllProgress = async function () {
  const tasks = await Task.find({ ownerID: this.userID });

  if (tasks.length === 0) {
    this.planStats = [];
    this.totalTasks = 0;
    this.totalTasksFinished = 0;
    this.overallcompletion = 0;
    await this.save();
    return;
  }

  // group tasks by studyPlanID
  const planMap = new Map();

  for (const task of tasks) {
    const key = task.studyPlanID.toString();

    if (!planMap.has(key)) {
      planMap.set(key, {
        studyPlan: task.studyPlanID,
        totalTasks: 0,
        completedTasks: 0,
      });
    }

    const plan = planMap.get(key);
    plan.totalTasks++;

    if (task.completed) {
      plan.completedTasks++;
    }
  }

  // rebuild planStats from scratch
  this.planStats = [];

  for (const plan of planMap.values()) {
    const percent =
      plan.totalTasks === 0
        ? 0
        : Number(((plan.completedTasks / plan.totalTasks) * 100).toFixed(2));

    this.planStats.push({
      studyPlan: plan.studyPlan,
      totalTasks: plan.totalTasks,
      completedTasks: plan.completedTasks,
      percentComplete: percent,
    });
  }

  // totals
  this.totalTasks = this.planStats.reduce((sum, p) => sum + p.totalTasks, 0);
  this.totalTasksFinished = this.planStats.reduce(
    (sum, p) => sum + p.completedTasks,
    0
  );

  this.calculateUserScore();

  await this.save();
};

module.exports = mongoose.model("ProgressTracker", progressTrackerSchema)