const taskController = require("../controllers/taskController");
const Task = require("../models/Task");
const ProgressTracker = require("../models/ProgressTracker");
const pdfParse = require("pdf-parse");

jest.mock("../models/Task");
jest.mock("../models/ProgressTracker");
jest.mock("pdf-parse");

// Mock global fetch for AI calls
global.fetch = jest.fn();

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

describe("taskController - Document Generation", () => {
  let res;
  let mockTracker;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();

    // Mock ProgressTracker for syncTaskProgress
    mockTracker = {
      updateTaskProgress: jest.fn().mockResolvedValue(true),
      recalculateAllProgress: jest.fn().mockResolvedValue(true),
    };
    ProgressTracker.findOne.mockResolvedValue(mockTracker);

    process.env.OLLAMA_URL = "http://localhost:11434/api/chat";
    process.env.OLLAMA_MODEL = "phi3";
  });

  describe("generateTasksFromAssignmentDocument", () => {
    test("returns 400 if studyPlanId is missing", async () => {
      const req = { body: {}, user: { userId: USER_ID } };
      await taskController.generateTasksFromAssignmentDocument(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "studyPlanId is required" }),
      );
    });

    test("returns 400 if no file is uploaded", async () => {
      const req = {
        body: { studyPlanId: "plan1" },
        user: { userId: USER_ID },
        file: null,
      };
      await taskController.generateTasksFromAssignmentDocument(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "PDF file is required" }),
      );
    });

    test("successfully parses PDF and inserts tasks from AI response", async () => {
      // 1. Mock PDF Text Extraction
      pdfParse.mockResolvedValue({
        text: "Assignment: Build a React App. Due Oct 1st.",
      });

      // 2. Mock AI Response
      const aiResponse = {
        message: {
          content: JSON.stringify({
            tasks: [
              {
                title: "Setup Project",
                priority: "high",
                dueDate: "2026-10-01T23:59:00Z",
              },
              { title: "Implement Auth", priority: "medium" },
            ],
          }),
        },
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(aiResponse),
      });

      // 3. Mock Database Insertion
      const mockCreatedTasks = [
        { _id: "1", title: "Setup Project" },
        { _id: "2", title: "Implement Auth" },
      ];
      Task.insertMany.mockResolvedValue(mockCreatedTasks);

      const req = {
        body: { studyPlanId: "plan1", maxTasks: "5" },
        user: { userId: USER_ID },
        file: { buffer: Buffer.from("fake pdf"), originalname: "hw.pdf" },
      };

      await taskController.generateTasksFromAssignmentDocument(req, res);

      // Verify PDF was parsed
      expect(pdfParse).toHaveBeenCalledWith(req.file.buffer);

      // Verify AI was called with document text
      expect(global.fetch).toHaveBeenCalled();

      // Verify DB interaction
      expect(Task.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: "Setup Project", priority: "high" }),
        ]),
      );

      // Verify Response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Created 2 tasks",
        tasks: mockCreatedTasks,
      });
    });

    test("returns 500 if AI returns no valid tasks", async () => {
      pdfParse.mockResolvedValue({ text: "Empty document" });
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: JSON.stringify({ tasks: [] }) },
        }),
      });

      const req = {
        body: { studyPlanId: "plan1" },
        user: { userId: USER_ID },
        file: { buffer: Buffer.from("fake pdf") },
      };

      await taskController.generateTasksFromAssignmentDocument(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Failed to parse AI response into tasks",
        }),
      );
    });

    test("handles normalizePriority defaulting to medium", async () => {
      pdfParse.mockResolvedValue({ text: "Content" });
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: {
            content: JSON.stringify({
              tasks: [{ title: "Task", priority: "super-urgent" }],
            }),
          },
        }),
      });
      Task.insertMany.mockResolvedValue([{ title: "Task" }]);

      const req = {
        body: { studyPlanId: "plan1" },
        user: { userId: USER_ID },
        file: { buffer: Buffer.from("pdf") },
      };

      await taskController.generateTasksFromAssignmentDocument(req, res);

      // Check that the task sent to insertMany has "medium" priority
      const insertedTasks = Task.insertMany.mock.calls[0][0];
      expect(insertedTasks[0].priority).toBe("medium");
    });
  });
});
