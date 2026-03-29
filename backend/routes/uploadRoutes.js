const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.memoryStorage();

// Using multer for file upload
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
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

    // Processing pdf text using pdf-parse 
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const data = await pdfParse(req.file.buffer);
      const text = data?.text || "";
      const pageCount = data?.numpages || 0;

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


router.post("/generate-note", protect, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Missing text to summarize" });
    }

    const ollamaUrl = process.env.OLLAMA_URL;
    const ollamaModel = process.env.OLLAMA_MODEL;

    if (!ollamaUrl) {
      return res.status(500).json({ message: "OLLAMA_URL is not configured" });
    }

    if (!ollamaModel) {
      return res.status(500).json({ message: "OLLAMA_MODEL is not configured" });
    }

    const prompt = `You are an expert teaching assistant creating study materials for a university student. 

Your task is to analyze the following extracted text and synthesize it into comprehensive, highly readable study notes. 

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THIS EXACT TEMPLATE:
[Short, Descriptive Plain Text Title Goes Here - ABSOLUTELY NO MARKDOWN OR SYMBOLS]

[Start the body of your notes here using Markdown...]

CONTENT GUIDELINES:
- Structure & Size: Use Markdown headings (## for major topics, ### for subtopics).
- Lists: Use bulleted lists (-) for related concepts and numbered lists (1., 2.) for steps.
- Bold **key terms** and definitions.
- Be concise, but do not omit crucial academic details.

Extracted lecture text:
"""
${text.slice(0, 12000)}
"""`;

  const aiRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
    model: ollamaModel,
        messages: [
          { role: "system", content: "You summarize lecture content into structured study notes." },
          { role: "user", content: prompt },
        ],
    stream: false,
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      console.error("Ollama error:", aiRes.status, errorText);
      return res.status(502).json({ message: "Ollama request failed" });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || "";

    if (!content) {
      return res.status(500).json({ message: "Ollama returned no content" });
    }

    // First line as title, the rest as body
    const [firstLine, ...restLines] = content.split(/\r?\n/);
    const title = firstLine.trim() || "AI Generated Note";
    const body = restLines.join("\n").trim();

    return res.json({
      title,
      content: body || content,
      raw: content,
    });
  } catch (err) {
  console.error("Error generating note with Ollama:", err);
    return res.status(500).json({ message: "Failed to generate note" });
  }
});

module.exports = router;