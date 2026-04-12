const express = require("express");
const router = express.Router();
const {
  getAttachments,
  createAttachment,
  updateAttachment,
  deleteAttachment,
} = require("../controllers/attachmentController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, getAttachments);
router.post("/", auth, createAttachment);
router.put("/:id", auth, updateAttachment);
router.delete("/:id", auth, deleteAttachment);

module.exports = router;
