const Task = require("../models/Task");
const ProgressTracker = require("../models/ProgressTracker");
const { checkTaskAchievements } = require("../services/achievementService");
const pdfParse = require("pdf-parse");

const normalizePriority = (priority) => {
  return ["low", "medium", "high"].includes(priority) ? priority : "medium";
};

const syncTaskProgress = async (ownerId, studyPlanId) => {
  let tracker = await ProgressTracker.findOne({ userID: ownerId });
  if (!tracker) {
    tracker = await ProgressTracker.create({ userID: ownerId });
    await tracker.recalculateAllProgress();
  }
  await tracker.updateTaskProgress(studyPlanId);
};

exports.getTasks = async (req, res) => {
  try {
    const { studyPlanId } = req.query;

    if (!studyPlanId)
      return res.status(400).json({ message: "studyPlanId is required" });

    const tasks = await Task.find({
      ownerID: req.user.userId,
      studyPlanID: studyPlanId,
    });

    res.json(tasks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { studyPlanID, title, description, priority, dueDate } = req.body;

    if (!studyPlanID)
      return res.status(400).json({ message: "studyPlanID is required" });

    const task = await Task.create({
      ownerID: req.user.userId,
      studyPlanID,
      title: title || "Untitled",
      description: description || "",
      completed: false,
      priority: priority || "medium",
      dueDate: dueDate || null,
      subTasks: [],
    });

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) {
      tracker = await ProgressTracker.create({ userID: task.ownerID });
      await tracker.recalculateAllProgress();
    }
    await tracker.updateTaskProgress(task.studyPlanID);

    res.status(201).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating task", error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    const wasCompleted = task.completed;
    //use model method to update task
    const updated = await task.updateTask(req.body);

    if (!wasCompleted && req.body.completed === true) {
      checkTaskAchievements(req.user.userId).catch(console.error);
    }

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) {
      tracker = await ProgressTracker.create({ userID: task.ownerID });
      await tracker.recalculateAllProgress();
    }
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating task", error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    await Task.deleteOne({ _id: task._id });

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) {
      tracker = await ProgressTracker.create({ userID: task.ownerID });
      await tracker.recalculateAllProgress();
    }
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json({ message: "Task deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting task", error: err.message });
  }
};

exports.createSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    const { title, description } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    task.subTasks.push({
      ownerID: req.user.userId,
      taskID: task._id,
      title,
      description: description || "",
      completed: false,
    });

    await task.save();

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) {
      tracker = await ProgressTracker.create({ userID: task.ownerID });
      await tracker.recalculateAllProgress();
    }
    await tracker.updateTaskProgress(task.studyPlanID);

    res.status(201).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating subtask", error: err.message });
  }
};

exports.updateSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    //use model method to update subtask
    const updated = await task.updateSubTask(req.params.subTaskId, req.body);

    // update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) {
      tracker = await ProgressTracker.create({ userID: task.ownerID });
      await tracker.recalculateAllProgress();
    }
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json(updated);
  } catch (err) {
    if (err.message === "Subtask not found")
      return res.status(404).json({ message: err.message });
    res
      .status(500)
      .json({ message: "Error updating subtask", error: err.message });
  }
};

exports.deleteSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    task.subTasks.pull({ _id: req.params.subTaskId });

    await task.save();

    //update progress tracker
    let tracker = await ProgressTracker.findOne({ userID: task.ownerID });
    if (!tracker) {
      tracker = await ProgressTracker.create({ userID: task.ownerID });
      await tracker.recalculateAllProgress();
    }
    await tracker.updateTaskProgress(task.studyPlanID);

    res.json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting subtask", error: err.message });
  }
};

exports.generateTaskBreakdown = async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log("[POST] /tasks/:id/generate-breakdown", {
      id: taskId,
      userId: req.user.userId,
    });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.ownerID.toString() !== req.user.userId)
      return res.status(403).json({ message: "Forbidden" });

    const title = task.title || "";
    const description = task.description || "";

    const combinedText = `Title: ${title}\n${description}`.slice(0, 12000);

    if (!process.env.OLLAMA_URL || !process.env.OLLAMA_MODEL) {
      return res.status(500).json({ message: "OLLAMA configuration missing" });
    }

    const prompt = `You are an expert project planner and execution assistant.
Break down the task into relevant, actionable subtasks.

MANDATORY OUTPUT FORMAT:
Return ONLY one valid JSON object with this exact root key:
{
  "subtasks": [
    {
      "title": "Short subtask title",
      "description": "Optional brief detail"
    }
  ]
}

STRICT RULES:
1. Output ONLY valid JSON. No markdown. No commentary.
2. Root key must be "subtasks".
3. Each item must include a non-empty "title" string.
4. "description" is optional but recommended.
5. Generate 3 to 8 subtasks when enough context exists.
6. Subtask titles must be concise and action-oriented.
7. Do not include IDs, timestamps, or extra keys.

TASK CONTEXT:
"""
${combinedText}
"""`;
    console.log("Sending AI request for task breakdown...");

    const aiRes = await fetch(process.env.OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: [
          { role: "system", content: "You are a tool that outputs only JSON." },
          { role: "user", content: prompt },
        ],
        format: "json",
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("Ollama error (task breakdown):", aiRes.status, errText);
      return res.status(502).json({ message: "AI service request failed" });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || "";
    console.log("AI response length:", content.length);

    try {
      const parsed = JSON.parse(content);
      const rawSubtasks = parsed.subtasks || [];
      const subtasks = rawSubtasks
        .map((s) => ({
          title: String(s.title || "").trim(),
          description: String(s.description || "").trim(),
        }))
        .filter((s) => s.title)
        .slice(0, 50);

      if (!subtasks.length) throw new Error("No subtasks parsed");

      return res.json({ subtasks, raw: content });
    } catch (parseErr) {
      console.error(
        "Failed to parse AI JSON for task breakdown:",
        parseErr.message,
      );
      return res.status(500).json({
        message: "Failed to parse AI response into subtasks",
        raw: content,
      });
    }
  } catch (err) {
    console.error("Error generating task breakdown:", err.message || err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message || String(err),
    });
  }
};

exports.generateTasksFromAssignmentDocument = async (req, res) => {
  try {
    const { studyPlanId, maxTasks } = req.body || {};
    console.log("[POST] /tasks/generate-from-document", {
      userId: req.user.userId,
      studyPlanId,
      maxTasks,
      fileName: req.file?.originalname,
      mimeType: req.file?.mimetype,
      fileSize: req.file?.size,
    });

    if (!studyPlanId) {
      return res.status(400).json({ message: "studyPlanId is required" });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const upload = await pdfParse(req.file.buffer);
    const documentText = String(upload?.text || "").trim();

    if (!documentText) {
      return res.status(400).json({ message: "No text extracted from PDF" });
    }

    const ollamaUrl = process.env.OLLAMA_URL;
    const ollamaModel = process.env.OLLAMA_MODEL;
    if (!ollamaUrl || !ollamaModel) {
      return res.status(500).json({ message: "OLLAMA configuration missing" });
    }

    const safeMax = Math.min(Math.max(parseInt(maxTasks || 12, 10), 1), 100);
    const currentDate = new Date().toISOString().split("T")[0];

    const prompt = `You are an academic planning assistant.
Read the assignment document and convert it into actionable to-do tasks.

Today's date is: ${currentDate}.

MANDATORY OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact root key:
{
  "tasks": [
    {
      "title": "Short task title",
      "description": "Optional brief detail",
      "priority": "low|medium|high",
      "dueDate": "2026-09-15T23:59:00Z"
    }
  ]
}

STRICT RULES:
1. Output ONLY valid JSON. No markdown, commentary, or code fences.
2. Generate only tasks that are clearly relevant to the assignment requirements.
3. Keep titles concise and action-oriented.
4. Use due dates only when they are stated or clearly inferable from the assignment.
5. If no due date is known, omit dueDate or set it to null.
6. Do not include IDs, estimates, or extra keys.
7. Generate between 3 and 12 tasks when enough context exists.

ASSIGNMENT DOCUMENT:
"""
${documentText.slice(0, 12000)}
"""`;

    console.log("Sending AI request for assignment task generation...");

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

    console.log("AI service responded for assignment task generation", {
      status: aiRes.status,
      ok: aiRes.ok,
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => "");
      console.error(
        "Ollama error (assignment tasks):",
        aiRes.status,
        errorText,
      );
      return res.status(502).json({ message: "AI service request failed" });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || aiJson?.response || "{}";
    console.log("AI response length (assignment tasks):", content.length);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error(
        "Failed to parse AI JSON for assignment tasks:",
        parseErr.message,
      );
      return res.status(500).json({
        message: "Failed to parse AI response into tasks",
        raw: content,
      });
    }

    const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    const normalizedTasks = rawTasks
      .slice(0, safeMax)
      .map((item) => {
        const title = String(item?.title || "Untitled")
          .trim()
          .slice(0, 120);
        const description = String(item?.description || "").trim();
        const priority = normalizePriority(
          String(item?.priority || "medium").toLowerCase(),
        );

        let dueDate = null;
        if (item?.dueDate) {
          const parsedDate = new Date(item.dueDate);
          if (!Number.isNaN(parsedDate.getTime())) {
            dueDate = parsedDate;
          }
        }

        return {
          ownerID: req.user.userId,
          studyPlanID: studyPlanId,
          title,
          description,
          completed: false,
          priority,
          dueDate,
          subTasks: [],
        };
      })
      .filter((task) => task.title && task.title !== "Untitled");

    if (!normalizedTasks.length) {
      return res.status(500).json({
        message: "Failed to parse AI response into tasks",
      });
    }

    const createdTasks = await Task.insertMany(normalizedTasks);
    await syncTaskProgress(req.user.userId, studyPlanId);

    console.log("Assignment task generation complete", {
      generatedCount: normalizedTasks.length,
      createdCount: createdTasks.length,
      studyPlanId,
      userId: req.user.userId,
    });

    return res.status(201).json({
      message: `Created ${createdTasks.length} tasks`,
      tasks: createdTasks,
    });
  } catch (err) {
    console.error(
      "Error generating tasks from assignment document:",
      err.message || err,
    );
    return res.status(500).json({
      message: "Failed to generate tasks from assignment document",
      error: err.message || String(err),
    });
  }
};
