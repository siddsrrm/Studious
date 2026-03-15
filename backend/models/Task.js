const mongoose = require("mongoose");

const SubTaskSchema = new mongoose.Schema(
  {
    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const TaskSchema = new mongoose.Schema(
  {
    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studyPlanID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    priority: { type: String, default: "medium" },
    dueDate: { type: Date, default: null },
    subTasks: [SubTaskSchema],
  },
  { timestamps: true },
);

TaskSchema.methods.updateTask = async function (updates) {
  const allowed = ["title", "description", "completed", "priority", "dueDate"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) this[field] = updates[field];
  });
  await this.save();
  return this;
};

TaskSchema.methods.updateSubTask = async function (subTaskId, updates) {
  const subTask = this.subTasks.id(subTaskId);
  if (!subTask) throw new Error("Subtask not found");
  const allowed = ["title", "description", "completed"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) subTask[field] = updates[field];
  });

  // auto-complete parent if all subtasks are done
  const allComplete = this.subTasks.every((st) => st.completed);
  if (allComplete && this.subTasks.length > 0) this.completed = true;
  await this.save();
  return this;
};

TaskSchema.methods.scheduleReminder = function (reminderTime) {
  // logic to set up reminder
};

module.exports = mongoose.model("Task", TaskSchema);
