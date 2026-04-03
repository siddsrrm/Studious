const express = require("express");
const router = express.Router();
const { createStudyPlan, getUserStudyPlans, deleteStudyPlan } = require("../controllers/studyPlanController");
const { addMilestone, editMilestone, deleteMilestone } = require("../controllers/milestoneController");
const authToken = require("../middleware/authMiddleware");

router.post("/", authToken, createStudyPlan);
router.get("/", authToken, getUserStudyPlans);
router.delete("/:id", authToken, deleteStudyPlan);

router.post("/:id/milestones", authToken, addMilestone);
router.patch("/:id/milestones/:msId", authToken, editMilestone);
router.delete("/:id/milestones/:msId", authToken, deleteMilestone);

module.exports = router;
