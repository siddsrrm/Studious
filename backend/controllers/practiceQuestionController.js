const PracticeQuestion = require("../models/PracticeQuestion");
const Note = require("../models/Note");

exports.getPracticeQuestions = async (req, res) => {
  try {
    const { studyPlanId } = req.query;

    console.log("[GET] /practice-questions", {
      userId: req.user.userId,
      studyPlanId,
    });

    if (!studyPlanId) {
      console.log("[GET] Missing studyPlanId");
      return res.status(400).json({ message: "studyPlanId is required" });
    }

    const practiceQuestions = await PracticeQuestion.find({
      ownerID: req.user.userId,
      studyPlanId: studyPlanId,
    });

    console.log("[GET] Found questions:", practiceQuestions.length);

    res.json(practiceQuestions);
  } catch (err) {
    console.error("[GET] Error:", err.message);
    res.status(500).json({
      message: "Error fetching practice questions",
      error: err.message,
    });
  }
};

exports.createPracticeQuestion = async (req, res) => {
  try {
    const { studyPlanId, question, answer } = req.body;

    console.log("[POST] /practice-questions", {
      userId: req.user.userId,
      studyPlanId,
      question,
      answer,
    });

    if (!studyPlanId) {
      console.log("[POST] Missing studyPlanId");
      return res.status(400).json({ message: "studyPlanId is required" });
    }

    if (!question || !answer) {
      console.log("[POST] Missing question or answer");
      return res.status(400).json({ message: "Question and answer required" });
    }

    const practiceQuestion = await PracticeQuestion.create({
      ownerID: req.user.userId,
      studyPlanId,
      question,
      answer,
    });

    console.log("[POST] Created question ID:", practiceQuestion._id);

    res.status(201).json(practiceQuestion);
  } catch (err) {
    console.error("[POST] Error:", err.message);
    res.status(500).json({
      message: "Error creating practice question",
      error: err.message,
    });
  }
};

exports.updatePracticeQuestion = async (req, res) => {
  try {
    console.log("[PUT] /practice-questions/:id", {
      id: req.params.id,
      updates: req.body,
      userId: req.user.userId,
    });

    const practiceQuestion = await PracticeQuestion.findById(req.params.id);

    if (
      !practiceQuestion ||
      practiceQuestion.ownerID.toString() !== req.user.userId
    ) {
      console.log("[PUT] Forbidden or not found:", req.params.id);
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await practiceQuestion.updatePracticeQuestion(req.body);

    console.log("[PUT] Updated question:", updated._id);

    res.json(updated);
  } catch (err) {
    console.error("[PUT] Error:", err.message);
    res.status(500).json({
      message: "Error updating practice question",
      error: err.message,
    });
  }
};

exports.deletePracticeQuestion = async (req, res) => {
  try {
    console.log("[DELETE] /practice-questions/:id", {
      id: req.params.id,
      userId: req.user.userId,
    });

    const practiceQuestion = await PracticeQuestion.findById(req.params.id);

    if (!practiceQuestion) {
      console.log("[DELETE] Not found:", req.params.id);
      return res.status(404).json({ message: "Practice question not found" });
    }

    if (practiceQuestion.ownerID.toString() !== req.user.userId) {
      console.log("[DELETE] Forbidden:", req.params.id);
      return res.status(403).json({ message: "Forbidden" });
    }

    await practiceQuestion.deleteOne({ _id: req.params.id });

    console.log("[DELETE] Deleted:", req.params.id);

    res.json({ message: "Practice question deleted" });
  } catch (err) {
    console.error("[DELETE] Error:", err.message);
    res.status(500).json({
      message: "Error deleting practice question",
      error: err.message,
    });
  }
};

// const fs = require("fs");
// const path = require("path");

exports.generatePracticeQuestions = async (req, res) => {
  try {
    const { studyPlanId, noteIds, questionType, numQuestions } = req.body;

    console.log("Starting practice question generation...");
    console.log(`Type: ${questionType}, Count: ${numQuestions || "auto"}`);

    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ message: "noteIds array is required" });
    }

    const notes = await Note.find({
      _id: { $in: noteIds },
      ownerID: req.user.userId,
    });

    console.log(`Fetched ${notes.length} note(s) from database`);
    if (notes.length === 0)
      return res.status(404).json({ message: "No notes found" });

    const combinedText = notes
      .map((note) => `Title: ${note.title}\n${note.content}`)
      .join("\n\n---\n\n")
      .slice(0, 12000);

    console.log(`Combined text length: ${combinedText.length} characters`);

    const isMC = questionType === "multiple-choice";
    const prompt = `You are an expert educator. Based on the notes provided, generate EXACTLY ${numQuestions || 3} questions.

    ### MANDATORY OUTPUT FORMAT:
    Return ONLY a JSON object. Do not include any other question types.

    ${
      isMC
        ? `// Format for Multiple Choice:
    {
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0
        }
      ]
    }`
        : `// Format for Free Response:
    {
      "questions": [
        {
          "question": "What specific term describes the process of plants making food?",
          "answer": "Photosynthesis" 
        }
      ]
    }`
    }

    ### STRICT RULES:
    1. ONLY generate "${questionType}" questions. 
    2. Do NOT include a "freeResponseQuestions" key if asking for multiple-choice.
    3. Do NOT include a "multipleChoiceQuestions" key if asking for free-response.
    4. The root key must be "questions".
    5. Generate exactly ${numQuestions || 3} items.${
      !isMC
        ? `
    6. FREE RESPONSE RULE 1: The "answer" MUST be a maximum of 2 words.
    7. FREE RESPONSE RULE 2: Focus ONLY on vocabulary terms, specific names, or key concepts. 
    8. FREE RESPONSE RULE 3: Do NOT ask conceptual "how" or "why" questions. Only ask "what" or "who" questions that can be answered with a single term.`
        : ""
    }

    ### Study Notes:
    """
    ${combinedText}
    """`;

    console.log(`Sending request to Ollama (${process.env.OLLAMA_MODEL})...`);
    const aiRes = await fetch(process.env.OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a teacher who only communicates in raw JSON data structures.",
          },
          { role: "user", content: prompt },
        ],
        format: "json", // Hard requirement for valid JSON output
        stream: false,
        options: { temperature: 0.3 }, // Low temperature for higher accuracy
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      console.error("Ollama error:", aiRes.status, errorText);
      return res.status(502).json({ message: "AI service request failed" });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || "";
    console.log("Received AI response. Length:", content.length);

    //DELETE THIS LATER - TEMP DEBUGGING
    // const logPath = path.join(__dirname, "ai_logs.txt");
    // fs.appendFileSync(logPath, `\n\n=== ${new Date().toISOString()} ===\n${content}\n`);

    try {
      const parsedData = JSON.parse(content);
      const rawQuestions = parsedData.questions || [];

      const generatedQuestions = rawQuestions.map((q, index) => {
        const questionObj = {
          question: q.question,
          answer: isMC ? q.options[q.correctIndex] : q.answer,
          options: isMC ? q.options : [],
          questionType: questionType,
          ownerID: req.user.userId,
          studyPlanId,
          generatedFromNoteId: notes[0]._id,
        };

        console.log(
          `Parsed Question #${index + 1}: "${q.question.substring(0, 50)}..."`,
        );
        return questionObj;
      });

      if (generatedQuestions.length === 0)
        throw new Error("No questions found in JSON");

      const savedQuestions =
        await PracticeQuestion.insertMany(generatedQuestions);
      console.log(
        `Saved ${savedQuestions.length} questions to database. Done!\n`,
      );

      res.status(201).json({
        message: `Successfully generated ${savedQuestions.length} practice questions`,
        questions: savedQuestions,
      });
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", content);
      return res.status(500).json({
        message: "Failed to parse AI response into valid questions",
        raw: content,
      });
    }
  } catch (err) {
    console.error("Error generating practice questions:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
