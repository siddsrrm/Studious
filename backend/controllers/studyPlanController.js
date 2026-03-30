const StudyPlan = require("../models/StudyPlan");

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

// Delete a study plan
exports.deleteStudyPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Study plan not found" });
    if (plan.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await StudyPlan.deleteOne({ _id: plan._id });
    res.json({ message: "Study plan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


