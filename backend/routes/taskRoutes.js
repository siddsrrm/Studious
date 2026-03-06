const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const {getTasks, createTask, updateTask, deleteTask, createSubTask, updateSubTask, deleteSubTask } = require("../controllers/taskController");

router.get("/", authToken, getTasks);
router.post("/", authToken, createTask);
router.put("/:id", authToken, updateTask);
router.delete("/:id", authToken, deleteTask);
router.post("/:id/subtasks", authToken, createSubTask);
router.put("/:id/subtasks/:subTaskId", authToken, updateSubTask);
router.delete("/:id/subtasks/:subTaskId", authToken, deleteSubTask);

module.exports = router;