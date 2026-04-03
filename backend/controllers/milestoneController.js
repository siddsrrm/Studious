const StudyPlan = require("../models/StudyPlan");

exports.addMilestone = async (req, res) => {
  const { title, targetPercent } = req.body;

  if (!title || targetPercent === undefined) {
    return res.status(400).json({ message: "Title and targetPercent are required." });
  }
  if (targetPercent < 1 || targetPercent > 100) {
    return res.status(400).json({ message: "targetPercent must be between 1 and 100." });
  }

  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ message: "Study plan not found." });

    plan.milestones.push({ title, targetPercent });
    await plan.save();

    const newMilestone = plan.milestones[plan.milestones.length - 1];
    res.status(201).json({ milestone: newMilestone });
  } catch (err) {
    res.status(500).json({ message: "Failed to add milestone." });
  }
};

exports.editMilestone = async (req, res) => {
  const { title, targetPercent } = req.body;

  if (targetPercent !== undefined && (targetPercent < 1 || targetPercent > 100)) {
    return res.status(400).json({ message: "targetPercent must be between 1 and 100." });
  }

  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ message: "Study plan not found." });

    const milestone = plan.milestones.id(req.params.msId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found." });

    if (title !== undefined) milestone.title = title;
    if (targetPercent !== undefined) milestone.targetPercent = targetPercent;

    await plan.save();
    res.json({ milestone });
  } catch (err) {
    res.status(500).json({ message: "Failed to update milestone." });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ message: "Study plan not found." });

    const milestone = plan.milestones.id(req.params.msId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found." });

    milestone.deleteOne();
    await plan.save();

    res.json({ message: "Milestone deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete milestone." });
  }
};