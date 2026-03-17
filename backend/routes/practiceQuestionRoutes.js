const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const {
  getPracticeQuestions,
  createPracticeQuestion,
  updatePracticeQuestion,
  deletePracticeQuestion,
} = require("../controllers/practiceQuestionController");

router.get("/", authToken, getPracticeQuestions);
router.post("/", authToken, createPracticeQuestion);
router.put("/:id", authToken, updatePracticeQuestion);
router.delete("/:id", authToken, deletePracticeQuestion);

module.exports = router;
