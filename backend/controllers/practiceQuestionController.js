const PracticeQuestion = require("../models/PracticeQuestion");
const Note = require("../models/Note");

exports.getPracticeQuestions = async (req, res) => {
  try {
    const { studyPlanId } = req.query;
    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });
    const practiceQuestions = await PracticeQuestion.find({
      ownerID: req.user.userId,
      studyPlanId: studyPlanId,
    });
    res.json(practiceQuestions);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching practice questions",
      error: err.message,
    });
  }
};

exports.createPracticeQuestion = async (req, res) => {
  try {
    const { studyPlanId, question, answer } = req.body;
    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });
    if (!question || !answer)
      return res.status(400).json({ message: "Question and answer required" });
    const practiceQuestion = await PracticeQuestion.create({
      ownerID: req.user.userId,
      studyPlanId,
      question: question,
      answer: answer,
    });
    res.status(201).json(practiceQuestion);
  } catch (err) {
    res.status(500).json({
      message: "Error creating practice question",
      error: err.message,
    });
  }
};

exports.updatePracticeQuestion = async (req, res) => {
  try {
    const practiceQuestion = await PracticeQuestion.findById(req.params.id);
    if (
      !practiceQuestion ||
      practiceQuestion.ownerID.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    //use model method to update practiceQuestion
    const updated = await practiceQuestion.updatePracticeQuestion(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Error updating practice question",
      error: err.message,
    });
  }
};

exports.deletePracticeQuestion = async (req, res) => {
  try {
    const practiceQuestion = await PracticeQuestion.findById(req.params.id);
    if (!practiceQuestion)
      return res.status(404).json({ message: "Practice question not found" });
    if (practiceQuestion.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });
    await PracticeQuestion.deleteOne({ _id: req.params.id });
    res.json({ message: "Practice question deleted" });
  } catch (err) {
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

    // console.log("Starting practice question generation...");
    // console.log(`Type: ${questionType}, Count: ${numQuestions || "auto"}`);

    // 1. Validation
    if (!studyPlanId) return res.status(400).json({ message: "studyPlanId is required" });
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ message: "noteIds array is required" });
    }

    // 2. Fetch Notes
    const notes = await Note.find({
      _id: { $in: noteIds },
      ownerID: req.user.userId,
    });

    // console.log(`Fetched ${notes.length} note(s) from database`);
    if (notes.length === 0) return res.status(404).json({ message: "No notes found" });

    const combinedText = notes
      .map((note) => `Title: ${note.title}\n${note.content}`)
      .join("\n\n---\n\n")
      .slice(0, 12000);

    // console.log(`Combined text length: ${combinedText.length} characters`);

    // 3. Construct JSON Prompt
    const isMC = questionType === "multiple-choice";
    const prompt = `You are an expert educator. Based on the notes provided, generate EXACTLY ${numQuestions || 3} questions.

    ### MANDATORY OUTPUT FORMAT:
    Return ONLY a JSON object. Do not include any other question types.

    ${isMC ?
        `// Format for Multiple Choice:
    {
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0
        }
      ]
    }` :
        `// Format for Free Response:
    {
      "questions": [
        {
          "question": "What specific term describes the process of plants making food?",
          "answer": "Photosynthesis" 
        }
      ]
    }`}

    ### STRICT RULES:
    1. ONLY generate "${questionType}" questions. 
    2. Do NOT include a "freeResponseQuestions" key if asking for multiple-choice.
    3. Do NOT include a "multipleChoiceQuestions" key if asking for free-response.
    4. The root key must be "questions".
    5. Generate exactly ${numQuestions || 3} items.${!isMC ? `
    6. FREE RESPONSE RULE 1: The "answer" MUST be a maximum of 2 words.
    7. FREE RESPONSE RULE 2: Focus ONLY on vocabulary terms, specific names, or key concepts. 
    8. FREE RESPONSE RULE 3: Do NOT ask conceptual "how" or "why" questions. Only ask "what" or "who" questions that can be answered with a single term.` : ""}

    ### Study Notes:
    """
    ${combinedText}
    """`;

    // 4. Call Ollama
    // console.log(`Sending request to Ollama (${process.env.OLLAMA_MODEL})...`);
    const aiRes = await fetch(process.env.OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: [
          { role: "system", content: "You are a teacher who only communicates in raw JSON data structures." },
          { role: "user", content: prompt },
        ],
        format: "json", // Hard requirement for valid JSON output
        stream: false,
        options: { temperature: 0.3 } // Low temperature for higher accuracy
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      // console.error("Ollama error:", aiRes.status, errorText);
      return res.status(502).json({ message: "AI service request failed" });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || "";
    // console.log("✓ Received AI response. Length:", content.length);

    //DELETE THIS LATER - TEMP DEBUGGING
    // const logPath = path.join(__dirname, "ai_logs.txt");
    // fs.appendFileSync(logPath, `\n\n=== ${new Date().toISOString()} ===\n${content}\n`);

    // 6. Parse and Save
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

        // console.log(`Parsed Question #${index + 1}: "${q.question.substring(0, 50)}..."`);
        return questionObj;
      });

      if (generatedQuestions.length === 0) throw new Error("No questions found in JSON");

      const savedQuestions = await PracticeQuestion.insertMany(generatedQuestions);
      // console.log(`Saved ${savedQuestions.length} questions to database. Done!\n`);

      res.status(201).json({
        message: `Successfully generated ${savedQuestions.length} practice questions`,
        questions: savedQuestions,
      });

    } catch (parseError) {
      // console.error("Failed to parse AI JSON:", content);
      return res.status(500).json({
        message: "Failed to parse AI response into valid questions",
        raw: content
      });
    }

  } catch (err) {
    // console.error("Error generating practice questions:", err.message);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};


// exports.generatePracticeQuestions = async (req, res) => {
//   try {
//     const { studyPlanId, noteIds, questionType, numQuestions } = req.body;

//     console.log("🚀 Starting practice question generation...");
//     console.log(`Question Type: ${questionType}, Num Questions: ${numQuestions || "auto"}`);

//     // Validate required fields
//     if (!studyPlanId)
//       return res.status(400).json({ message: "studyPlanId is required" });
//     if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0)
//       return res
//         .status(400)
//         .json({ message: "noteIds array is required and must not be empty" });
//     if (!questionType || !["multiple-choice", "free-response"].includes(questionType))
//       return res.status(400).json({ message: "Invalid questionType. Must be 'multiple-choice' or 'free-response'" });

//     // Fetch the notes
//     const notes = await Note.find({
//       _id: { $in: noteIds },
//       ownerID: req.user.userId,
//     });

//     console.log(`✓ Fetched ${notes.length} note(s) from database`);

//     if (notes.length === 0)
//       return res.status(404).json({ message: "No notes found with provided IDs" });

//     // Combine note content
//     const combinedText = notes
//       .map((note) => `Title: ${note.title}\n${note.content}`)
//       .join("\n\n---\n\n");

//     console.log(`Combined text length: ${combinedText.length} characters`);

//     if (combinedText.length === 0)
//       return res.status(400).json({ message: "Notes contain no content" });

//     const ollamaUrl = process.env.OLLAMA_URL;
//     const ollamaModel = process.env.OLLAMA_MODEL;

//     if (!ollamaUrl)
//       return res.status(500).json({ message: "OLLAMA_URL is not configured" });
//     if (!ollamaModel)
//       return res.status(500).json({ message: "OLLAMA_MODEL is not configured" });

//     // Create the prompt based on question type
//     let prompt;
//     if (questionType === "multiple-choice") {
//       prompt = `You are an expert educator creating practice questions for a student's study material.

// Your task is to generate exactly ${numQuestions || 3} multiple-choice questions.

// STRICT OUTPUT FORMAT (MUST FOLLOW EXACTLY):
// Each question must be on ONE SINGLE LINE in the exact format:
// QUESTION|Option A|Option B|Option C|Option D|Correct Letter

// CRITICAL RULES (DO NOT VIOLATE):
// - Each line must contain EXACTLY 6 parts separated by the "|" character
// - There must be EXACTLY 4 answer choices (A, B, C, D)
// - The correct answer MUST be a single letter: A, B, C, or D
// - DO NOT include numbering (NO "1)", "2)", etc.)
// - DO NOT include bullet points or extra characters
// - DO NOT include explanations or extra text
// - DO NOT add spaces around the "|" separators
// - DO NOT merge the answer letter with Option D

// CORRECT EXAMPLE:
// What is photosynthesis?|The process of converting light to sound|The process where plants convert light to chemical energy|The process of plant respiration|The breakdown of glucose|B

// INCORRECT EXAMPLES (DO NOT DO THESE):
// 1) Question?|A|B|C|D|A   ← WRONG (numbering)
// Question?|A|B|C|D A     ← WRONG (missing "|")
// Question?|A|B|C|D|Answer is A ← WRONG (extra text)

// If you cannot follow the format EXACTLY, output nothing.

// Study Notes:
// """
// ${combinedText.slice(0, 12000)}
// """`;
//     } else {
//       prompt = `You are an expert educator creating practice questions for a student's study material.

// Based on the following study notes, generate exactly ${numQuestions || 3} free-response practice questions.

// FORMAT REQUIREMENTS - FOLLOW EXACTLY:
// Each question and answer must be on ONE line in this exact format:
// QUESTION|ANSWER

// Example:
// What are the three main types of rocks?|Igneous, sedimentary, and metamorphic rocks.

// REQUIREMENTS:
// - Create exactly ${numQuestions || 3} questions
// - Questions should be specific and testable
// - Answers should be concise but complete
// - Only output the questions, no explanations

// Study Notes:
// """
// ${combinedText.slice(0, 12000)}
// """`;
//     }

//     // Call Ollama
//     const aiRes = await fetch(ollamaUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: ollamaModel,
//         messages: [
//           {
//             role: "system",
//             content: "You are an expert educator creating precisely formatted practice questions.",
//           },
//           { role: "user", content: prompt },
//         ],
//         stream: false,
//       }),
//     });

//     if (!aiRes.ok) {
//       const errorText = await aiRes.text().catch(() => "");
//       console.error("❌ Ollama error:", aiRes.status, errorText);
//       return res.status(502).json({ message: "AI service request failed" });
//     }

//     const aiJson = await aiRes.json();
//     const content = aiJson?.message?.content || "";

//     console.log("✓ Received AI response");
//     console.log(`Response length: ${content.length} characters`);

//     if (!content) {
//       console.error("❌ AI service returned no content");
//       return res.status(500).json({ message: "AI service returned no content" });
//     }

//     console.log("🧪 Writing raw AI response to log file...");

//     const fs = require("fs");
//     const path = require("path");
//     const logPath = path.join(__dirname, "ai_logs.txt");

//     fs.appendFileSync(
//       logPath,
//       `\n\n=== ${new Date().toISOString()} ===\n${content}\n`
//     );

//     console.log("📝 Raw AI Response:\n", content);

//     // Parse the response based on question type
//     const generatedQuestions = [];
//     const lines = content.split(/\r?\n/).filter((line) => line.trim());

//     console.log(`Parsing ${lines.length} lines from AI response...`);

//     for (const line of lines) {
//       if (!line.includes("|")) continue;

//       let parts = line.split("|").map((p) => p.trim());

//       if (questionType === "multiple-choice") {

//         // Handle case where answer letter is stuck to last option
//         if (parts.length === 5) {
//           const lastPart = parts[4];

//           // Try to extract trailing answer letter (A/B/C/D)
//           const match = lastPart.match(/(.+)([A-D])$/);

//           if (match) {
//             parts[4] = match[1].trim(); // Option D
//             parts.push(match[2]);       // Correct letter
//           }
//         }
//         if (parts.length < 6) {
//           console.warn(`⚠️  Skipping malformed MC question (expected 6 parts, got ${parts.length}): "${line.substring(0, 50)}..."`);
//           continue;
//         }

//         const question = parts[0];
//         const options = [parts[1], parts[2], parts[3], parts[4]];
//         const correctLetter = (parts[5] || "A").toUpperCase();
//         const correctIndex = correctLetter.charCodeAt(0) - 65; // Convert A/B/C/D to 0/1/2/3

//         if (correctIndex < 0 || correctIndex > 3) {
//           console.warn(`⚠️  Skipping MC question with invalid answer letter "${correctLetter}": "${question.substring(0, 50)}..."`);
//           continue;
//         }
//         const correctAnswer = options[correctIndex];

//         const questionObj = {
//           question,
//           answer: correctAnswer,
//           options,
//           questionType: "multiple-choice",
//           ownerID: req.user.userId,
//           studyPlanId,
//           generatedFromNoteId: notes[0]._id,
//         };

//         console.log(`✓ MC Question #${generatedQuestions.length + 1}: "${question}"`);
//         console.log(`  Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(" | ")}`);
//         console.log(`  Correct Answer: ${correctAnswer}`);

//         generatedQuestions.push(questionObj);
//       } else {
//         // free-response
//         if (parts.length < 2) {
//           console.warn(`⚠️  Skipping malformed free-response question (expected 2 parts, got ${parts.length}): "${line.substring(0, 50)}..."`);
//           continue;
//         }

//         const question = parts[0];
//         const answer = parts[1];

//         const questionObj = {
//           question,
//           answer,
//           questionType: "free-response",
//           ownerID: req.user.userId,
//           studyPlanId,
//           generatedFromNoteId: notes[0]._id,
//         };

//         console.log(`✓ Free-Response Question #${generatedQuestions.length + 1}: "${question}"`);
//         console.log(`  Answer: "${answer}"`);

//         generatedQuestions.push(questionObj);
//       }
//     }

//     if (generatedQuestions.length === 0) {
//       console.error("❌ Failed to parse any valid questions from AI response");
//       console.error("Raw response:", content);
//       return res.status(500).json({
//         message: "Failed to parse AI response into valid questions",
//         raw: content,
//       });
//     }

//     console.log(`\n✅ Successfully parsed ${generatedQuestions.length} questions!`);

//     // Save to database
//     const savedQuestions = await PracticeQuestion.insertMany(
//       generatedQuestions,
//     );

//     console.log(`✅ Saved ${savedQuestions.length} questions to database`);
//     console.log("🎉 Practice question generation complete!\n");

//     res.status(201).json({
//       message: `Successfully generated ${savedQuestions.length} practice questions`,
//       questions: savedQuestions,
//     });
//   } catch (err) {
//     console.error("❌ Error generating practice questions:", err);
//     console.error("Error details:", err.message);
//     res.status(500).json({
//       message: "Error generating practice questions",
//       error: err.message,
//     });
//   }
// };
