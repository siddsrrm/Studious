const taskController = require("../controllers/taskController");
const Task = require("../models/Task");
const ProgressTracker = require("../models/ProgressTracker");
const { checkTaskAchievements } = require("../services/achievementService");

jest.mock("../models/Task");
jest.mock("../models/ProgressTracker");
jest.mock("../services/achievementService");

// Mock global fetch for Ollama calls
global.fetch = jest.fn();

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

describe("taskController Tests", () => {
  let res;
  let mockTracker;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();

    // Default Mock for ProgressTracker
    mockTracker = {
      updateTaskProgress: jest.fn().mockResolvedValue(true),
      recalculateAllProgress: jest.fn().mockResolvedValue(true),
    };
    ProgressTracker.findOne.mockResolvedValue(mockTracker);
    ProgressTracker.create.mockResolvedValue(mockTracker);

    // Set env variables for Ollama
    process.env.OLLAMA_URL = "http://localhost:11434/api/chat";
    process.env.OLLAMA_MODEL = "phi3";
  });

  // ------------------- updateTask (Achievement Logic) -------------------
  describe("updateTask achievements", () => {
    test("triggers achievements when task moves from incomplete to complete", async () => {
      const mockTask = {
        _id: "t1",
        ownerID: { toString: () => USER_ID },
        completed: false,
        studyPlanID: "plan1",
        updateTask: jest.fn().mockResolvedValue({ _id: "t1", completed: true }),
      };
      Task.findById.mockResolvedValue(mockTask);
      checkTaskAchievements.mockResolvedValue({});

      const req = {
        params: { id: "t1" },
        body: { completed: true },
        user: { userId: USER_ID },
      };

      await taskController.updateTask(req, res);

      expect(checkTaskAchievements).toHaveBeenCalledWith(USER_ID);
      expect(mockTracker.updateTaskProgress).toHaveBeenCalledWith("plan1");
    });
  });

  // ------------------- generateTaskBreakdown (AI) -------------------
  describe("generateTaskBreakdown", () => {
    test("returns 404 if task doesn't exist", async () => {
      Task.findById.mockResolvedValue(null);
      const req = { params: { id: "t1" }, user: { userId: USER_ID } };

      await taskController.generateTaskBreakdown(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("successfully parses valid AI JSON response", async () => {
      const mockTask = {
        _id: "t1",
        ownerID: { toString: () => USER_ID },
        title: "Clean Kitchen",
        description: "Deep clean",
      };
      Task.findById.mockResolvedValue(mockTask);

      // Mock successful Ollama response
      const aiResponse = {
        message: {
          content: JSON.stringify({
            subtasks: [
              { title: "Wash dishes", description: "Use soap" },
              { title: "Mop floor" },
            ],
          }),
        },
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(aiResponse),
      });

      const req = { params: { id: "t1" }, user: { userId: USER_ID } };
      await taskController.generateTaskBreakdown(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          subtasks: expect.arrayContaining([
            expect.objectContaining({ title: "Wash dishes" }),
          ]),
        }),
      );
    });

    test("returns 502 if Ollama service fails", async () => {
      Task.findById.mockResolvedValue({
        _id: "t1",
        ownerID: { toString: () => USER_ID },
      });

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Internal Server Error"),
      });

      const req = { params: { id: "t1" }, user: { userId: USER_ID } };
      await taskController.generateTaskBreakdown(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        message: "AI service request failed",
      });
    });

    test("returns 500 if AI returns invalid JSON", async () => {
      Task.findById.mockResolvedValue({
        _id: "t1",
        ownerID: { toString: () => USER_ID },
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ message: { content: "Not JSON at all" } }),
      });

      const req = { params: { id: "t1" }, user: { userId: USER_ID } };
      await taskController.generateTaskBreakdown(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Failed to parse AI response into subtasks",
        }),
      );
    });
  });
});
