const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const {
  getPracticeQuestions,
  createPracticeQuestion,
  updatePracticeQuestion,
  deletePracticeQuestion,
  generatePracticeQuestions,
  logPracticeQuestionAttempt,
  generateMasteryPracticeTest,
} = require("../controllers/practiceQuestionController");

router.get("/", authToken, getPracticeQuestions);
router.post("/", authToken, createPracticeQuestion);
router.post("/generate", authToken, generatePracticeQuestions);
router.post("/generate-mastery", authToken, generateMasteryPracticeTest);
router.put("/:id", authToken, updatePracticeQuestion);
router.post("/:id/attempt", authToken, logPracticeQuestionAttempt);
router.delete("/:id", authToken, deletePracticeQuestion);

module.exports = router;
