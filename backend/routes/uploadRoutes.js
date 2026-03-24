const express = require("express");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.memoryStorage();

// Using multer for file upload
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});


router.post("/pdf", protect, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      if (err.code === "LIMIT_FILE_SIZE" || err.message.includes("large")) {
        return res.status(413).json({ message: "File too large (max 20MB)" });
      }
      if (err.message === "Only PDF files are allowed") {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: "File upload failed" });
    }

    // Processing pdf text using pdf-parser
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const parser = new PDFParse({ data: req.file.buffer });
      
      const result = await parser.getText();
      const text = result.text || "";

      const info = await parser.getInfo();
      const pageCount = info?.pages || 0;

      await parser.destroy();

      return res.json({
        fileName: req.file.originalname,
        pageCount: pageCount,
        text,
      });
      
    } catch (parseErr) {
      console.error("Error processing PDF text:", parseErr);
      return res.status(500).json({ message: "Failed to read PDF contents" });
    }
  });
});

module.exports = router;