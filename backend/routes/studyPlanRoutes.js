const express = require("express");
const router = express.Router();
const { createStudyPlan, getUserStudyPlans, deleteStudyPlan } = require("../controllers/studyPlanController");
const authToken = require("../middleware/authMiddleware");

router.post("/", authToken, createStudyPlan);
router.get("/", authToken, getUserStudyPlans);
router.delete("/:id", authToken, deleteStudyPlan);

module.exports = router;
