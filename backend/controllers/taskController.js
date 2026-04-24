const Task = require("../models/Task");
const ProgressTracker = require("../models/ProgressTracker");
const { checkTaskAchievements } = require("../services/achievementService");

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
