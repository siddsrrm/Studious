const Task = require("../models/Task");
const ProgressTracker = require("../models/ProgressTracker");

exports.getTasks = async (req, res) => {
  try {
    const { studyPlanId } = req.query;

    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });

    const tasks = await Task.find({
      ownerID: req.user.userId,
      studyPlanID: studyPlanId,
    });

    res.json(tasks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { studyPlanID, title, description, priority, dueDate } = req.body;

    if (!studyPlanID)
      return res.status(400).json({ message: "studyPlanID is required" });

    const task = await Task.create({
      ownerID: req.user.userId,
      studyPlanID,
      title: title || "Untitled",
      description: description || "",
      completed: false,
      priority: priority || "medium",
      dueDate: dueDate || null,
      subTasks: [],
    });

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) tracker = await ProgressTracker.create({ userID: task.ownerID });
    await tracker.updateTaskProgress(task.studyPlanID);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Error creating task", error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    //use model method to update task
    const updated = await task.updateTask(req.body);

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) tracker = await ProgressTracker.create({ userID: task.ownerID });
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating task", error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    await Task.deleteOne({ _id: task._id });

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json({ message: "Task deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting task", error: err.message });
  }
};

exports.createSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    const { title, description } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    task.subTasks.push({
      ownerID: req.user.userId,
      taskID: task._id,
      title,
      description: description || "",
      completed: false,
    });

    await task.save();

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) tracker = await ProgressTracker.create({ userID: task.ownerID });
    await tracker.updateTaskProgress(task.studyPlanID);

    res.status(201).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating subtask", error: err.message });
  }
};

exports.updateSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    //use model method to update subtask
    const updated = await task.updateSubTask(req.params.subTaskId, req.body);

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) tracker = await ProgressTracker.create({ userID: task.ownerID });
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json(updated);
  } catch (err) {
    if (err.message === "Subtask not found")
      return res.status(404).json({ message: err.message });
    res
      .status(500)
      .json({ message: "Error updating subtask", error: err.message });
  }
};

exports.deleteSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    task.subTasks.pull({ _id: req.params.subTaskId });

    await task.save();

    //update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (tracker) {
      await tracker.updateTaskProgress(task.studyPlanID);
    }

    res.json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting subtask", error: err.message });
  }
};
