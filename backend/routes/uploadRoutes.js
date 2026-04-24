const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const protect = require("../middleware/authMiddleware");
const ffmpeg = require("fluent-ffmpeg");
const whisper =
  require("whisper-node").default || require("whisper-node").whisper;
const path = require("path");
const fs = require("fs");

const router = express.Router();

const storage = multer.memoryStorage();

// PDF upload (in-memory)
const uploadPdf = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, //20 mb
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("Only PDF files are allowed"));
  },
});

router.post("/pdf", protect, (req, res) => {
  uploadPdf.single("file")(req, res, async (err) => {
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

// Video upload + audio->text extraction (disk)
const videoUploadDir = path.join(__dirname, "../data/assets");
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoUploadDir),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") return cb(null, true);
    return cb(new Error("Only MP4 files are allowed"));
  },
});

router.post("/video", protect, (req, res) => {
  uploadVideo.single("file")(req, res, async (err) => {
    if (err) {
      console.error("Multer video upload error:", err);
      if (err.code === "LIMIT_FILE_SIZE" || err.message?.includes?.("large")) {
        return res.status(413).json({ message: "File too large (max 500MB)" });
      }
      if (err.message === "Only MP4 files are allowed") {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: "File upload failed" });
    }

    let videoPath;
    let audioPath;

    try {
      if (!req.file?.path) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      videoPath = req.file.path;
      audioPath = videoPath.replace(path.extname(videoPath), ".wav");

      console.log("[uploadRoutes] starting ffmpeg extraction", {
        videoPath,
        audioPath,
      });
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .noVideo()
          .audioChannels(1)
          .audioFrequency(16000)
          .format("wav")
          .on("start", (cmd) =>
            console.log("[uploadRoutes] ffmpeg start:", cmd),
          )
          .on("progress", (p) =>
            console.log("[uploadRoutes] ffmpeg progress:", p),
          )
          .on("end", () => {
            console.log(
              "[uploadRoutes] ffmpeg finished, audio saved to",
              audioPath,
            );
            resolve();
          })
          .on("error", (err) => {
            console.error("[uploadRoutes] ffmpeg error:", err);
            reject(err);
          })
          .save(audioPath);
      });

      console.log(
        "[uploadRoutes] calling whisper for transcription on",
        audioPath,
      );
      let transcript;
      try {
        transcript = await whisper(audioPath, {
          //small fast model
          modelName: "tiny.en",
          whisperOptions: {
            language: "en",
            gen_file_txt: false,
            gen_file_subtitle: false,
            gen_file_vtt: false,
          },
        });
        console.log("[uploadRoutes] whisper result type:", typeof transcript);
      } catch (wErr) {
        console.error("[uploadRoutes] whisper error:", wErr);
        throw wErr;
      }

      let text = "";
      if (Array.isArray(transcript)) {
        text = transcript
          .map((t) => t?.speech || "")
          .join(" ")
          .trim();
      } else if (typeof transcript === "string") {
        text = transcript.trim();
      } else if (transcript?.text) {
        text = String(transcript.text).trim();
      }

      if (!text) {
        return res.status(400).json({ message: "No speech detected in video" });
      }

      // Log extracted text to server console for debugging
      console.log("[uploadRoutes] extracted text:", text);

      return res.json({
        fileName: req.file.originalname,
        text,
      });
    } catch (err2) {
      console.error("Video processing error:", err2);
      const message =
        err2 && err2.message ? err2.message : "Failed to process video";
      return res.status(500).json({ message });
    } finally {
      try {
        if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      } catch {}
      try {
        if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      } catch {}
    }
  });
});

// Generic file upload (used by Attachments frontend)
const genericUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoUploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.post("/file", protect, (req, res) => {
  genericUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "Upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    return res.json({
      filename: req.file.originalname,
      fileUrl: `/uploads/${path.basename(req.file.path)}`, // or however you serve static files
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
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

    if (!ollamaUrl || !ollamaModel) {
      return res.status(500).json({ message: "OLLAMA configuration missing" });
    }

    const systemPrompt = `You are an expert teaching assistant.
Your ONLY job is to convert lecture text into structured study notes.

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON with keys "title" and "body".
2. "title": A short, 3-5 word plain text title. No HTML.
3. "body": An HTML string using this EXACT structure:
   - Use <h2> for main topics
   - Use <h3> for subtopics
   - Use <ul> and <li> for bulleted lists
   - Use <strong> for key terms: <strong>Term</strong>: Definition
   - Use <blockquote> for important callouts
   - NEVER use circles (●) or Markdown symbols like ## or **.
   - Do NOT wrap the output in a markdown code block (like \`\`\`html). Just return the raw HTML string inside the JSON.

OUTPUT ONLY JSON. No explanation, no extra text.`;

    // Add uniqueness to prompt with task ID section to stop AI from skipping prompt
    const userPrompt = `Task ID: ${Date.now()}
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
        format: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short plain-text title" },
            body: { type: "string", description: "Detailed Markdown notes" },
          },
          required: ["title", "body"],
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        options: {
          num_ctx: 8192,
          temperature: 0.3,
          num_predict: 2048,
        },
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      console.error("Ollama error:", aiRes.status, errorText);
      return res.status(502).json({ message: "Ollama request failed" });
    }

    const aiJson = await aiRes.json();
    const contentString = aiJson?.message?.content || aiJson?.response || "{}";
    let parsedContent;
    try {
      parsedContent = JSON.parse(contentString);
    } catch (e) {
      console.warn(
        "Failed to parse AI JSON, falling back to plain-text parsing:",
        e.message,
      );
      const lines = String(contentString || "")
        .split(/\r?\n/)
        .filter(Boolean);
      const firstLine = lines.shift() || "AI Generated Note";
      const body = lines.join("\n") || contentString || "No notes generated.";
      parsedContent = { title: firstLine.trim(), body };
    }

    return res.json({
      title: parsedContent.title || "AI Generated Note",
      content: parsedContent.body || "No notes generated.",
      raw: contentString,
    });
  } catch (err) {
    console.error("Error generating note with Ollama:", err);
    return res.status(500).json({ message: "Failed to generate note" });
  }
});

router.post("/generate-tasks", protect, async (req, res) => {
  try {
    const { studyPlanId, maxTasks } = req.body || {};
    const syllabusText = req.body?.syllabusText || req.body?.text;
    if (!studyPlanId) {
      return res.status(400).json({ message: "studyPlanId is required" });
    }
    if (!syllabusText || typeof syllabusText !== "string") {
      return res.status(400).json({ message: "Missing text" });
    }

    const ollamaUrl = process.env.OLLAMA_URL;
    const ollamaModel = process.env.OLLAMA_MODEL;
    if (!ollamaUrl || !ollamaModel) {
      return res.status(500).json({ message: "OLLAMA configuration missing" });
    }

    const safeMax = Math.min(Math.max(parseInt(maxTasks || 50, 10), 1), 100);

    const currentDate = new Date().toISOString().split("T")[0];

    const prompt = `You are a scheduling assistant. Your job is to extract EVERY assignment, exam, reading, and deadline mentioned in a college syllabus and convert them into individual tasks.

Today's date is: ${currentDate}. Use this to resolve any ambiguous dates or missing years.

### MANDATORY OUTPUT FORMAT:
Return ONLY a valid JSON object with a "tasks" array.

{
  "tasks": [
    {
      "title": "Assignment 1: Read Chapter 4",
      "type": "reading", // must be "reading", "assignment", "exam", or "other"
      "dueDate": "2026-09-15T23:59:00Z", // ISO-8601 format, use exact date from syllabus
      "priority": "medium", // "low", "medium", or "high"
      "estimatedHours": 2
    }
  ]
}

### CRITICAL RULES:
1. Output ONLY JSON. No markdown formatting around the output, no explanations.
2. Extract EVERY single assignment, exam, quiz, reading, project, etc. mentioned in the syllabus. Do not infer or add extra tasks unless explicitly mentioned.
3. Use the EXACT dates from the syllabus. Do not modify or clamp dates.
4. If a specific time is not given for a due date, default to 23:59:00Z.
5. If no due date is specified for a task, omit the dueDate field or set to null.
6. Break down large projects into individual tasks if the syllabus provides milestones or subtasks.

### SYLLABUS TEXT:
"""
${syllabusText.slice(0, 12000)}
"""`;
    const aiRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: "system", content: "You only output raw JSON." },
          { role: "user", content: prompt },
        ],
        format: "json",
        stream: false,
        options: { temperature: 0.2, num_ctx: 8192 },
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      console.error("Ollama error:", aiRes.status, errorText);
      return res.status(502).json({ message: "Ollama request failed" });
    }

    const aiJson = await aiRes.json();
    const contentString = aiJson?.message?.content || aiJson?.response || "{}";

    let parsed;
    try {
      parsed = JSON.parse(contentString);
      console.log("Successfully Parsed JSON:", parsed);
    } catch (e) {
      console.warn("Failed to parse AI JSON for tasks:", e.message);
      return res.status(500).json({ message: "Failed to parse AI response" });
    }

    const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    if (rawTasks.length === 0) {
      return res.status(200).json({ message: "No tasks extracted", tasks: [] });
    }

    // Lazy-load to avoid circular requires at top of file
    const Task = require("../models/Task");

    const sliced = rawTasks.slice(0, safeMax);
    const normalized = sliced.map((t) => {
      const title =
        String(t?.title || "Untitled")
          .slice(0, 80)
          .trim() || "Untitled";
      const description = String(t?.description || "").trim();
      const priority = ["low", "medium", "high"].includes(t?.priority)
        ? t.priority
        : "medium";

      let due = null;
      if (t?.dueDate) {
        const parsedDate = new Date(t.dueDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          due = parsedDate;
        }
      }

      return {
        ownerID: req.user.userId,
        studyPlanID: studyPlanId,
        title,
        description,
        completed: false,
        priority,
        dueDate: due,
        subTasks: [],
      };
    });

    const created = await Task.insertMany(normalized);
    return res.status(201).json({
      message: `Created ${created.length} tasks`,
      tasks: created,
    });
  } catch (err) {
    console.error("Error generating tasks with Ollama:", err);
    return res.status(500).json({ message: "Failed to generate tasks" });
  }
});

module.exports = router;
