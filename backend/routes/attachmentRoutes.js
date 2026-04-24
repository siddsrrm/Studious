const express = require("express");
const router = express.Router();
const {
  getAttachments,
  createAttachment,
  updateAttachment,
  deleteAttachment,
} = require("../controllers/attachmentController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "text/plain",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("File type not allowed"), false);
    }

    cb(null, true);
  },
});

router.get("/", auth, getAttachments);
router.post(
  "/",
  auth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  createAttachment,
);
router.put(
  "/:id",
  auth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  updateAttachment,
);
router.delete("/:id", auth, deleteAttachment);

module.exports = router;
