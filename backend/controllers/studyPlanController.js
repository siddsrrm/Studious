const StudyPlan = require("../models/StudyPlan");
const ProgressTracker = require("../models/ProgressTracker");
const Task = require("../models/Task");
const {
  checkStudyPlanAchievements,
} = require("../services/achievementService");

// Create a new study plan
exports.createStudyPlan = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newPlan = new StudyPlan({
      owner: req.user.userId,
      title: title.trim(),
      description: description ? description.trim() : "",
    });

    await newPlan.save();

    checkStudyPlanAchievements(req.user.userId).catch(console.error);
    res.status(201).json({ message: "Study plan created", studyPlan: newPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all study plans
exports.getUserStudyPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ owner: req.user.userId }).lean();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a study plan
exports.updateStudyPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, creditHours, workload } = req.body;

    const plan = await StudyPlan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: "Study plan not found" });
    }

    if (plan.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    /* Only update fields that are provided
     * Prevent invalid input for creditHours and workload
     */
    if (title !== undefined) plan.title = title;
    if (description !== undefined) plan.description = description;
    const parsedCredit = Number(creditHours);
    if (!isNaN(parsedCredit)) plan.creditHours = parsedCredit;
    const parsedWorkload = Number(workload);
    if (!isNaN(parsedWorkload)) plan.workload = parsedWorkload;

    await plan.save();

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a study plan
exports.deleteStudyPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Study plan not found" });
    if (plan.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Task.deleteMany({ studyPlanID: plan._id });

    await StudyPlan.deleteOne({ _id: plan._id });

    // Remove the deleted plan from the user's ProgressTracker and recalculate
    const tracker = await ProgressTracker.findOne({ userID: req.user.userId });
    if (tracker) {
      tracker.planStats = tracker.planStats.filter(
        (ps) => ps.studyPlan.toString() !== plan._id.toString(),
      );
      tracker.totalTasks = tracker.planStats.reduce(
        (sum, p) => sum + (p.totalTasks || 0),
        0,
      );
      tracker.totalTasksFinished = tracker.planStats.reduce(
        (sum, p) => sum + (p.completedTasks || 0),
        0,
      );
      tracker.calculateUserScore();
      await tracker.save();
    }

    res.json({ message: "Study plan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
