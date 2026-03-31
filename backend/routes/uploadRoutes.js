const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const protect = require("../middleware/authMiddleware");
const ffmpeg = require("fluent-ffmpeg");
const whisper = require("whisper-node").default || require("whisper-node").whisper;
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
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") return cb(null, true);
    return cb(new Error("Only MP4 files are allowed"));
  },
});

router.post("/video", protect, uploadVideo.single("file"), async (req, res) => {
  let videoPath;
  let audioPath;

  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    videoPath = req.file.path;
    audioPath = videoPath.replace(path.extname(videoPath), ".wav");

    console.log('[uploadRoutes] starting ffmpeg extraction', { videoPath, audioPath });
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .format("wav")
        .on('start', (cmd) => console.log('[uploadRoutes] ffmpeg start:', cmd))
        .on('progress', (p) => console.log('[uploadRoutes] ffmpeg progress:', p))
        .on('end', () => {
          console.log('[uploadRoutes] ffmpeg finished, audio saved to', audioPath);
          resolve();
        })
        .on('error', (err) => {
          console.error('[uploadRoutes] ffmpeg error:', err);
          reject(err);
        })
        .save(audioPath);
    });

    console.log('[uploadRoutes] calling whisper for transcription on', audioPath);
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
      console.log('[uploadRoutes] whisper result type:', typeof transcript);
    } catch (wErr) {
      console.error('[uploadRoutes] whisper error:', wErr);
      throw wErr;
    }

    let text = "";
    if (Array.isArray(transcript)) {
      text = transcript.map((t) => t?.speech || "").join(" ").trim();
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
  } catch (err) {
    console.error("Video processing error:", err);
    const message = err && err.message ? err.message : 'Failed to process video';
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
2. "title": A short, 3-5 word plain text title. No markdown.
3. "body": A markdown string using this EXACT structure:
   - Use ## for main topics
   - Use ### for subtopics  
   - Use bullet points for key terms: **Term**: Definition
   - Use > for important callouts
   - Separate each section with a blank line
   - Do NOT add a preamble or closing summary
   - NEVER use circles (●), checkboxes, or other special Unicode symbols for lists.

OUTPUT ONLY JSON. No explanation, no extra text.`;

    const userPrompt = `Extracted lecture text:\n"""\n${text.slice(0, 12000)}\n"""`;

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
            body: { type: "string", description: "Detailed Markdown notes" }
          },
          required: ["title", "body"]
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
    const contentString = aiJson?.message?.content || "{}";


    let parsedContent;
    try {
      parsedContent = JSON.parse(contentString);
    } catch (e) {
      console.error("Failed to parse AI JSON:", e);
      return res.status(500).json({ message: "AI returned invalid format" });
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

module.exports = router;