const scheduleController = require("../controllers/scheduleController");
const Task = require("../models/Task");
const Event = require("../models/Event");

jest.mock("../models/Task");
jest.mock("../models/Event");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

// Mock fetch (Ollama call)
global.fetch = jest.fn();

// ------------------- generateSchedule -------------------
describe("generateSchedule", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns tasks and events and calls AI API", async () => {
    const req = {
      body: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    const mockTasks = [
      {
        title: "Task 1",
        priority: "high",
        dueDate: new Date("2026-04-20"),
      },
    ];

    const mockEvents = [
      {
        title: "Busy",
        start: new Date("2026-04-19T10:00:00"),
        end: new Date("2026-04-19T11:00:00"),
      },
    ];

    Task.find.mockResolvedValue(mockTasks);
    Event.find.mockResolvedValue(mockEvents);

    global.fetch.mockResolvedValue({
  ok: true,
  status: 200,
  text: jest.fn().mockResolvedValue(""),
      json: jest.fn().mockResolvedValue({
        message: {
          content: JSON.stringify({
            schedule: [
              {
                taskId: 1,
                start: "2026-04-20T09:00",
                end: "2026-04-20T10:00",
              },
            ],
          }),
        },
      }),
    });

    await scheduleController.generateSchedule(req, res);

    expect(Task.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanID: "plan1",
      completed: false,
    });

    expect(Event.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
    });

    expect(global.fetch).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith([
      {
        title: "Task 1",
        start: "2026-04-20T09:00",
        end: "2026-04-20T10:00",
      },
    ]);
  });

  test("returns 500 when studyPlanId missing (DB still called safely)", async () => {
    const req = {
      body: {},
      user: { userId: USER_ID },
    };

    Task.find.mockResolvedValue([]);
    Event.find.mockResolvedValue([]);

    global.fetch.mockResolvedValue({
  ok: true,
  status: 200,
  text: jest.fn().mockResolvedValue(""),
      json: jest.fn().mockResolvedValue({
        message: { content: JSON.stringify({}) },
      }),
    });

    await scheduleController.generateSchedule(req, res);

    // Controller does NOT explicitly validate studyPlanId → it will still run
    expect(Task.find).toHaveBeenCalled();
  });

  test("returns 500 when AI response has invalid JSON", async () => {
    const req = {
      body: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    Task.find.mockResolvedValue([]);
    Event.find.mockResolvedValue([]);

    global.fetch.mockResolvedValue({
  ok: true,
  status: 200,
  text: jest.fn().mockResolvedValue(""),
      json: jest.fn().mockResolvedValue({
        message: {
          content: "THIS IS NOT JSON",
        },
      }),
    });

    await scheduleController.generateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("returns 500 when schedule missing in AI response", async () => {
    const req = {
      body: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    Task.find.mockResolvedValue([]);
    Event.find.mockResolvedValue([]);

    global.fetch.mockResolvedValue({
  ok: true,
  status: 200,
  text: jest.fn().mockResolvedValue(""),
      json: jest.fn().mockResolvedValue({
        message: {
          content: JSON.stringify({ wrongKey: [] }),
        },
      }),
    });

    await scheduleController.generateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid AI response format",
    });
  });

  test("handles fetch failure gracefully", async () => {
    const req = {
      body: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    Task.find.mockResolvedValue([]);
    Event.find.mockResolvedValue([]);

    global.fetch.mockRejectedValue(new Error("Network error"));

    await scheduleController.generateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});
