const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const multer = require("multer");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  generateTaskBreakdown,
  generateTasksFromAssignmentDocument,
} = require("../controllers/taskController");

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("Only PDF files are allowed"));
  },
});

const handlePdfUpload = (req, res, next) => {
  uploadPdf.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE" || err.message?.includes?.("large")) {
        return res.status(413).json({ message: "File too large (max 20MB)" });
      }

      if (err.message === "Only PDF files are allowed") {
        return res.status(400).json({ message: err.message });
      }

      return res.status(400).json({ message: "File upload failed" });
    }

    next();
  });
};

router.get("/", authToken, getTasks);
router.post("/", authToken, createTask);
router.put("/:id", authToken, updateTask);
router.delete("/:id", authToken, deleteTask);
router.post("/:id/subtasks", authToken, createSubTask);
router.put("/:id/subtasks/:subTaskId", authToken, updateSubTask);
router.delete("/:id/subtasks/:subTaskId", authToken, deleteSubTask);
router.post("/:id/generate-breakdown", authToken, generateTaskBreakdown);
router.post(
  "/generate-from-document",
  authToken,
  handlePdfUpload,
  generateTasksFromAssignmentDocument,
);

module.exports = router;
