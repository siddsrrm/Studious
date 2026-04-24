const express = require("express");
const router = express.Router();
const {
  getGradeBook,
  addEntry,
  updateEntry,
  deleteEntry,
} = require("../controllers/gradeBookController");
const authToken = require("../middleware/authMiddleware");

router.get("/:studyPlanId", authToken, getGradeBook);
router.post("/:studyPlanId/entries", authToken, addEntry);
router.patch("/:studyPlanId/entries/:entryId", authToken, updateEntry);
router.delete("/:studyPlanId/entries/:entryId", authToken, deleteEntry);

module.exports = router;
