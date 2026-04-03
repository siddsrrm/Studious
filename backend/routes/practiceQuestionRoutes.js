const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const {
  getPracticeQuestions,
  createPracticeQuestion,
  updatePracticeQuestion,
  deletePracticeQuestion,
  generatePracticeQuestions,
} = require("../controllers/practiceQuestionController");

router.get("/", authToken, getPracticeQuestions);
router.post("/", authToken, createPracticeQuestion);
router.post("/generate", authToken, generatePracticeQuestions);
router.put("/:id", authToken, updatePracticeQuestion);
router.delete("/:id", authToken, deletePracticeQuestion);

module.exports = router;
