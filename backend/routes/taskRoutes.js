const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const {getTasks, createTask, updateTask, deleteTask, createSubTask, updateSubTask, deleteSubTask, generateTaskBreakdown } = require("../controllers/taskController");

router.get("/", authToken, getTasks);
router.post("/", authToken, createTask);
router.put("/:id", authToken, updateTask);
router.delete("/:id", authToken, deleteTask);
router.post("/:id/subtasks", authToken, createSubTask);
router.put("/:id/subtasks/:subTaskId", authToken, updateSubTask);
router.delete("/:id/subtasks/:subTaskId", authToken, deleteSubTask);
router.post("/:id/generate-breakdown", authToken, generateTaskBreakdown);

module.exports = router;