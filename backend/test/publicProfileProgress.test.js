const request = require("supertest");
const express = require("express");

jest.mock("../middleware/authMiddleware", () => {
  // auth middleware stub: always authenticate
  return (req, _res, next) => {
    req.user = { userId: "viewer-user" };
    next();
  };
});

jest.mock("../models/User");
jest.mock("../models/ProgressTracker");

let User = require("../models/User");
let ProgressTracker = require("../models/ProgressTracker");

describe("Public profile includes progress", () => {
  let app;

  beforeEach(() => {
  jest.resetModules();

  // Re-require mocked modules so we get fresh mock instances after reset
  User = require("../models/User");
  ProgressTracker = require("../models/ProgressTracker");

  const userRoutes = require("../routes/userRoutes");

  app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  });

  test("GET /api/users/:userId returns username/avatar plus progress object", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "friend-123",
        username: "friendUser",
        avatar: "https://example.com/avatar.png",
      }),
    });

    ProgressTracker.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        overallcompletion: 42.5,
        totalTasksFinished: 17,
        totalTasks: 40,
      }),
    });

    const res = await request(app).get("/api/users/friend-123");
    
  expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      _id: "friend-123",
      username: "friendUser",
      avatar: "https://example.com/avatar.png",
      progress: {
        score: 42.5,
        totalTasksFinished: 17,
        totalTasks: 40,
      },
    });
  });

  test("GET /api/users/:userId returns progress defaults when no tracker exists", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "friend-456",
        username: "noProgressUser",
        avatar: "",
      }),
    });

    ProgressTracker.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get("/api/users/friend-456");
    
  expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      _id: "friend-456",
      username: "noProgressUser",
      avatar: "",
      progress: {
        score: 0,
        totalTasksFinished: 0,
        totalTasks: 0,
      },
    });
  });
});
