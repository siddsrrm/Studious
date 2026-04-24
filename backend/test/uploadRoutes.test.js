const request = require("supertest");
const express = require("express");

jest.mock("../middleware/authMiddleware", () => {
  // auth middleware stub: always authenticate
  return (req, res, next) => {
    req.user = { userId: "test-user" };
    next();
  };
});

// Mock pdf-parse so we don't need real PDFs in tests
jest.mock("pdf-parse", () =>
  jest.fn(async () => ({ text: "Hello from PDF", numpages: 3 })),
);

jest.mock("fluent-ffmpeg", () => {
  return jest.fn(() => {
    const handlers = {};
    const cmd = {
      noVideo() {
        return cmd;
      },
      audioChannels() {
        return cmd;
      },
      audioFrequency() {
        return cmd;
      },
      format() {
        return cmd;
      },
      on(event, cb) {
        handlers[event] = cb;
        return cmd;
      },
      save(_path) {
        if (handlers["end"]) {
          setImmediate(handlers["end"]);
        }
        return cmd;
      },
    };
    return cmd;
  });
});

jest.mock("whisper-node", () =>
  jest.fn(async (_audioPath, _opts) => [
    { speech: "transcribed speech from video" },
  ]),
);

jest.mock("../models/Task", () => ({
  insertMany: jest.fn(async (docs) =>
    docs.map((d, i) => ({ _id: String(i + 1), ...d })),
  ),
}));

describe("uploadRoutes", () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        message: {
          content: JSON.stringify({
            tasks: [
              {
                title: "Read Chapter 1",
                description: "Intro",
                dueDate: "2026-01-10",
                priority: "high",
              },
              {
                title: "HW1",
                description: "Problems 1-10",
                dueDate: null,
                priority: "medium",
              },
            ],
          }),
        },
      }),
      text: async () => "",
      status: 200,
    }));

    process.env.OLLAMA_URL = "http://localhost:11434/api/chat";
    process.env.OLLAMA_MODEL = "llama3.2";

    const uploadRoutes = require("../routes/uploadRoutes");

    app = express();
    app.use(express.json());
    app.use("/api/upload", uploadRoutes);
  });

  afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
  });

  test("POST /api/upload/pdf returns extracted text + pageCount", async () => {
    const res = await request(app)
      .post("/api/upload/pdf")
      .attach("file", Buffer.from("%PDF-1.4 fake"), {
        filename: "slides.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      fileName: "slides.pdf",
      pageCount: 3,
      text: "Hello from PDF",
    });
  });

  test("POST /api/upload/pdf rejects non-pdf", async () => {
    const res = await request(app)
      .post("/api/upload/pdf")
      .attach("file", Buffer.from("not a pdf"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  describe("POST /api/upload/file (generic upload)", () => {
    test("uploads a file successfully and returns metadata", async () => {
      const res = await request(app)
        .post("/api/upload/file")
        .attach("file", Buffer.from("dummy file content"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("filename", "test.txt");
      expect(res.body).toHaveProperty("fileUrl");
      expect(res.body).toHaveProperty("size");
      expect(res.body).toHaveProperty("mimeType", "text/plain");
    });

    test("handles multer errors gracefully", async () => {
      const res = await request(app)
        .post("/api/upload/file")
        .attach("file", Buffer.from("test"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(res.status).not.toBe(500);
    });

    test("returns 400 if no file is uploaded", async () => {
      const res = await request(app).post("/api/upload/file");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "No file uploaded" });
    });

    test("rejects file when exceeding size limit", async () => {
      jest.resetModules();

      // Mock multer BEFORE requiring routes
      jest.doMock("multer", () => {
        const multerMock = () => ({
          single: () => (req, res, cb) => {
            const err = new Error("File too large");
            err.code = "LIMIT_FILE_SIZE";
            cb(err);
          },
        });

        multerMock.memoryStorage = jest.fn(() => ({}));
        multerMock.diskStorage = jest.fn(() => ({}));

        return multerMock;
      });

      const uploadRoutes = require("../routes/uploadRoutes");

      const app = express();
      app.use(express.json());
      app.use("/api/upload", uploadRoutes);

      const res = await request(app)
        .post("/api/upload/file")
        .attach("file", Buffer.from("small"), {
          filename: "test.bin",
          contentType: "application/octet-stream",
        });

      expect(res.status).toBe(413);
      expect(res.body).toHaveProperty("message");
    });
  });

  test("POST /api/upload/generate-note calls Ollama and returns title/content", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        message: {
          content: JSON.stringify({
            title: "Generated Title",
            body: "- Bullet 1\n- Bullet 2",
          }),
        },
      }),
      text: async () => "",
      status: 200,
    }));

    const res = await request(app)
      .post("/api/upload/generate-note")
      .send({ text: "Some extracted text" });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalled();
    expect(res.body.title).toBe("Generated Title");
    expect(res.body.content).toContain("- Bullet 1");
  });

  test("POST /api/upload/generate-note returns 400 when missing text", async () => {
    const res = await request(app).post("/api/upload/generate-note").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Missing text to summarize" });
  });

  test("POST /api/upload/generate-tasks returns 400 when missing studyPlanId", async () => {
    const res = await request(app)
      .post("/api/upload/generate-tasks")
      .send({ text: "syllabus text" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "studyPlanId is required" });
  });

  test("POST /api/upload/generate-tasks creates tasks from Ollama JSON", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        message: {
          content: JSON.stringify({
            tasks: [
              {
                title: "Read Chapter 1",
                description: "Intro",
                dueDate: "2026-01-10",
                priority: "high",
              },
              {
                title: "HW1",
                description: "Problems 1-10",
                dueDate: null,
                priority: "medium",
              },
            ],
          }),
        },
      }),
      text: async () => "",
      status: 200,
    }));

    const res = await request(app).post("/api/upload/generate-tasks").send({
      studyPlanId: "plan123",
      text: "Course syllabus... ",
      startDate: "2026-01-01",
      endDate: "2026-01-20",
      maxTasks: 10,
    });

    expect(res.status).toBe(201);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.tasks[0]).toMatchObject({
      studyPlanID: "plan123",
      title: "Read Chapter 1",
      priority: "high",
      completed: false,
    });
    expect(res.body.tasks[0].dueDate).toBeTruthy();
  });
});
