const Task = require("../models/Task");
const Event = require("../models/Event");

const PRIORITY_MAP = {
  high: 3,
  medium: 2,
  low: 1,
};

exports.generateSchedule = async (req, res) => {
  try {
    const { studyPlanId } = req.body;

    const tasks = await Task.find({
      ownerID: req.user.userId,
      studyPlanID: studyPlanId,
      completed: false,
    });

    const events = await Event.find({
      ownerID: req.user.userId,
    });

    // Only include SAFE fields (no user text)
    const taskData = tasks.map((t, index) => ({
      id: index + 1, // internal safe ID
      priority: PRIORITY_MAP[t.priority] || 2,
      dueDate: t.dueDate,
    }));

    // Map ID → original title (kept OUTSIDE prompt)
    const taskIdMap = {};
    tasks.forEach((t, index) => {
      taskIdMap[index + 1] = t.title;
    });

    const eventData = events.map((e) => ({
      start: e.start,
      end: e.end,
    }));

    const prompt = `
You are an intelligent scheduling assistant.

Your job is to create an optimized study schedule.

----------------------------------------
CURRENT CONTEXT
----------------------------------------
Today is: ${new Date().toISOString().split("T")[0]}
Current time: ${new Date().toISOString()}

IMPORTANT:
- You MUST NOT schedule anything in the past.
- All events must be on or after today's date.
- Use only future dates relative to today.

----------------------------------------
INPUT DATA
----------------------------------------
Tasks:
Each task has:
- id (number)
- priority (1=low, 2=medium, 3=high)
- dueDate (nullable)

${JSON.stringify(taskData)}

Existing busy times (DO NOT overlap):
${JSON.stringify(eventData)}

----------------------------------------
SCHEDULING RULES
----------------------------------------
1. Only schedule during free time
2. Do not schedule in the past
3. Prioritize tasks using BOTH:
   - earliest due date
   - highest priority
4. Higher priority tasks should generally be scheduled first
5. Break tasks into 1-2 hour sessions
6. Maximum 4 hours per day
7. Spread work across days
8. Prefer scheduling within next 14 days
9. Avoid back-to-back long sessions
10. If due date is soon, prioritize it even if priority is lower

----------------------------------------
OUTPUT REQUIREMENTS
----------------------------------------
- Output ONLY valid JSON
- Use task IDs (NOT names)
- Format:
{
  "schedule": [
    {
      "taskId": number,
      "start": "YYYY-MM-DDTHH:MM",
      "end": "YYYY-MM-DDTHH:MM"
    }
  ]
}
`;

    console.log("Sending AI request for schedule generation...");
    const aiRes = await fetch(process.env.OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a scheduling AI that only outputs JSON.",
          },
          { role: "user", content: prompt },
        ],
        format: "json",
        stream: false,
        options: { temperature: 0.2 },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error(
        "Ollama error (schedule generation):",
        aiRes.status,
        errText,
      );
      return res.status(502).json({ message: "AI service request failed" });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || "";
    console.log("AI response length:", content.length);

    const parsed = JSON.parse(content);

    if (!parsed.schedule) {
      return res.status(500).json({ message: "Invalid AI response format" });
    }

    // Convert taskId → real title AFTER AI responds
    const finalSchedule = parsed.schedule.map((e) => ({
      title: taskIdMap[e.taskId] || "Study Task",
      start: e.start,
      end: e.end,
    }));

    console.log("Final schedule generated:", finalSchedule);
    return res.json(finalSchedule);
  } catch (err) {
    console.error("Error generating schedule:", err.message);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
