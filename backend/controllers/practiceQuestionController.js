const PracticeQuestion = require("../models/PracticeQuestion");

exports.getPracticeQuestions = async (req, res) => {
  try {
    const { studyPlanId } = req.query;

    console.log("[GET] /practice-questions", {
      userId: req.user.userId,
      studyPlanId,
    });

    if (!studyPlanId) {
      console.log("[GET] Missing studyPlanId");
      return res.status(400).json({ message: "studyPlanId is required" });
    }

    const practiceQuestions = await PracticeQuestion.find({
      ownerID: req.user.userId,
      studyPlanId: studyPlanId,
    });

    console.log("[GET] Found questions:", practiceQuestions.length);

    res.json(practiceQuestions);
  } catch (err) {
    console.error("[GET] Error:", err.message);
    res.status(500).json({
      message: "Error fetching practice questions",
      error: err.message,
    });
  }
};

exports.createPracticeQuestion = async (req, res) => {
  try {
    const { studyPlanId, question, answer } = req.body;

    console.log("[POST] /practice-questions", {
      userId: req.user.userId,
      studyPlanId,
      question,
      answer,
    });

    if (!studyPlanId) {
      console.log("[POST] Missing studyPlanId");
      return res.status(400).json({ message: "studyPlanId is required" });
    }

    if (!question || !answer) {
      console.log("[POST] Missing question or answer");
      return res.status(400).json({ message: "Question and answer required" });
    }

    const practiceQuestion = await PracticeQuestion.create({
      ownerID: req.user.userId,
      studyPlanId,
      question,
      answer,
    });

    console.log("[POST] Created question ID:", practiceQuestion._id);

    res.status(201).json(practiceQuestion);
  } catch (err) {
    console.error("[POST] Error:", err.message);
    res.status(500).json({
      message: "Error creating practice question",
      error: err.message,
    });
  }
};

exports.updatePracticeQuestion = async (req, res) => {
  try {
    console.log("[PUT] /practice-questions/:id", {
      id: req.params.id,
      updates: req.body,
      userId: req.user.userId,
    });

    const practiceQuestion = await PracticeQuestion.findById(req.params.id);

    if (
      !practiceQuestion ||
      practiceQuestion.ownerID.toString() !== req.user.userId
    ) {
      console.log("[PUT] Forbidden or not found:", req.params.id);
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await practiceQuestion.updatePracticeQuestion(req.body);

    console.log("[PUT] Updated question:", updated._id);

    res.json(updated);
  } catch (err) {
    console.error("[PUT] Error:", err.message);
    res.status(500).json({
      message: "Error updating practice question",
      error: err.message,
    });
  }
};

exports.deletePracticeQuestion = async (req, res) => {
  try {
    console.log("[DELETE] /practice-questions/:id", {
      id: req.params.id,
      userId: req.user.userId,
    });

    const practiceQuestion = await PracticeQuestion.findById(req.params.id);

    if (!practiceQuestion) {
      console.log("[DELETE] Not found:", req.params.id);
      return res.status(404).json({ message: "Practice question not found" });
    }

    if (practiceQuestion.ownerID.toString() !== req.user.userId) {
      console.log("[DELETE] Forbidden:", req.params.id);
      return res.status(403).json({ message: "Forbidden" });
    }

    await practiceQuestion.deleteOne({ _id: req.params.id });

    console.log("[DELETE] Deleted:", req.params.id);

    res.json({ message: "Practice question deleted" });
  } catch (err) {
    console.error("[DELETE] Error:", err.message);
    res.status(500).json({
      message: "Error deleting practice question",
      error: err.message,
    });
  }
};
