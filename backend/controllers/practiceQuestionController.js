const PracticeQuestion = require("../models/PracticeQuestion");

exports.getPracticeQuestions = async (req, res) => {
  try {
    const { studyPlanId } = req.query;
    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });
    const practiceQuestions = await PracticeQuestion.find({
      ownerID: req.user.userId,
      studyPlanId: studyPlanId,
    });
    res.json(practiceQuestions);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching practice questions",
      error: err.message,
    });
  }
};

exports.createPracticeQuestion = async (req, res) => {
  try {
    const { studyPlanId, question, answer } = req.body;
    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });
    if (!question || !answer)
      return res.status(400).json({ message: "Question and answer required" });
    const practiceQuestion = await PracticeQuestion.create({
      ownerID: req.user.userId,
      studyPlanId,
      question: question,
      answer: answer,
    });
    res.status(201).json(practiceQuestion);
  } catch (err) {
    res.status(500).json({
      message: "Error creating practice question",
      error: err.message,
    });
  }
};

exports.updatePracticeQuestion = async (req, res) => {
  try {
    const practiceQuestion = await PracticeQuestion.findById(req.params.id);
    if (
      !practiceQuestion ||
      practiceQuestion.ownerID.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    //use model method to update practiceQuestion
    const updated = await practiceQuestion.updatePracticeQuestion(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Error updating practice question",
      error: err.message,
    });
  }
};

exports.deletePracticeQuestion = async (req, res) => {
  try {
    const practiceQuestion = await PracticeQuestion.findById(req.params.id);
    if (!practiceQuestion)
      return res.status(404).json({ message: "Practice question not found" });
    if (practiceQuestion.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });
    await PracticeQuestion.deleteOne();
    res.json({ message: "Practice question deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting practice question",
      error: err.message,
    });
  }
};
