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

Your job is to create a study schedule.

INPUT:
- Tasks with priorities and deadlines
- Existing calendar events (busy times)

RULES:
1. Only schedule during free time (not overlapping events)
2. Prioritize tasks with earlier deadlines
3. Break work into 1-2 hour sessions
4. Do not exceed 4 hours of study per day
5. Output ONLY valid JSON

FORMAT:
{
  "schedule": [
    {
      "title": "Task name",
      "start": "YYYY-MM-DDTHH:MM",
      "end": "YYYY-MM-DDTHH:MM"
    }
  ]
}

DATA:
Tasks:
${JSON.stringify(taskData)}

Events:
${JSON.stringify(eventData)}
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

    return res.json(parsed.schedule);
  } catch (err) {
    console.error("Error generating schedule:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

exports.bulkCreateEvents = async (req, res) => {
  if (!Array.isArray(req.body.events)) {
    return res.status(400).json({ message: "Invalid events payload" });
  }

  const events = req.body.events.map((e) => ({
    ownerID: req.user.userId,
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  try {
    const saved = await Event.insertMany(events);
    res.json(saved);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
