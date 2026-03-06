const mongoose = require("mongoose");

const SubTaskSchema = new mongoose.Schema({
    ownerID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskID: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
    ownerID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studyPlanID: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    priority: {type: String, default: "medium"},
    dueDate: {type: Date, default: null},
    subTasks: [SubTaskSchema],
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);