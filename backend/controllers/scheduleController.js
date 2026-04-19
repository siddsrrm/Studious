const Task = require("../models/Task");
const Event = require("../models/Event");

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

    const taskData = tasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
    }));

    const eventData = events.map((e) => ({
      title: e.title,
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
Tasks (with priorities and deadlines):
${JSON.stringify(taskData)}

Existing calendar events (busy times, DO NOT overlap):
${JSON.stringify(eventData)}

----------------------------------------
SCHEDULING RULES
----------------------------------------
1. Only schedule during free time (no overlap with events)
2. Do not schedule in the past under any circumstances
3. Tasks MUST be prioritized using BOTH due date AND priority

   Priority system (VERY IMPORTANT):
   - high priority = must be scheduled first (overrides due date unless due date is today/overdue)
   - medium priority = normal scheduling based on due date
   - low priority = schedule only after higher priorities are placed

4. Between tasks, always sort by:
   (1) earliest due date
   (2) highest priority
   Use this ordering when allocating study sessions.

5. Break tasks into 1–2 hour study sessions
6. Maximum 4 hours of study per day
7. Spread workload across multiple days when needed
8. Prefer scheduling within the next 14 days only
9. Avoid back-to-back long sessions (include breaks)
10. If a task is close to its due date, prioritize scheduling it sooner even if priority is low

----------------------------------------
OUTPUT REQUIREMENTS
----------------------------------------
- Output ONLY valid JSON (no commentary, no markdown)
- Do not include explanations
- Ensure all dates are ISO-like strings in format:
  YYYY-MM-DDTHH:MM

----------------------------------------
OUTPUT FORMAT
----------------------------------------
{
  "schedule": [
    {
      "title": "Task name",
      "start": "YYYY-MM-DDTHH:MM",
      "end": "YYYY-MM-DDTHH:MM"
    }
  ]
}
`;

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

    const aiJson = await aiRes.json();
    const content = aiJson?.message?.content || "";

    const parsed = JSON.parse(content);

    if (!parsed.schedule) {
      return res.status(500).json({ message: "Invalid AI response format" });
    }

    return res.json(parsed.schedule);
  } catch (err) {
    console.error("Error generating schedule:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
