const practiceQuestionController = require("../controllers/practiceQuestionController");
const PracticeQuestion = require("../models/PracticeQuestion");
const Note = require("../models/Note");

jest.mock("../models/PracticeQuestion");
jest.mock("../models/Note");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

// ------------------- getPracticeQuestions -------------------
describe("getPracticeQuestions", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when studyPlanId is missing", async () => {
    const req = { query: {}, user: { userId: USER_ID } };

    await practiceQuestionController.getPracticeQuestions(req, res);

    expect(PracticeQuestion.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "studyPlanId is required",
    });
  });

  test("returns practice questions", async () => {
    const mockData = [{ _id: "q1", question: "Test?", answer: "A" }];
    PracticeQuestion.find.mockResolvedValue(mockData);

    const req = {
      query: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.getPracticeQuestions(req, res);

    expect(PracticeQuestion.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanId: "plan1",
  hidden: { $ne: true },
    });
    expect(res.json).toHaveBeenCalledWith(mockData);
  });
});

// ------------------- createPracticeQuestion -------------------
describe("createPracticeQuestion", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when studyPlanId is missing", async () => {
    const req = {
      body: { question: "Q", answer: "A" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.createPracticeQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "studyPlanId is required",
    });
  });

  test("returns 400 when question or answer missing", async () => {
    const req = {
      body: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.createPracticeQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Question and answer required",
    });
  });

  test("creates practice question", async () => {
    const mockQuestion = { _id: "q1", question: "Q", answer: "A" };
    PracticeQuestion.create.mockResolvedValue(mockQuestion);

    const req = {
      body: { studyPlanId: "plan1", question: "Q", answer: "A" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.createPracticeQuestion(req, res);

    expect(PracticeQuestion.create).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanId: "plan1",
      question: "Q",
      answer: "A",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockQuestion);
  });
});

// ------------------- updatePracticeQuestion -------------------
describe("updatePracticeQuestion", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 403 if question not found", async () => {
    PracticeQuestion.findById.mockResolvedValue(null);

    const req = {
      params: { id: "q1" },
      body: { question: "New" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.updatePracticeQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("returns 403 if user is not owner", async () => {
    PracticeQuestion.findById.mockResolvedValue({
      ownerID: { toString: () => "otherUser" },
    });

    const req = {
      params: { id: "q1" },
      body: { question: "New" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.updatePracticeQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("updates and returns updated question", async () => {
    const mockUpdated = { _id: "q1", question: "New", answer: "A" };

    const mockDoc = {
      ownerID: { toString: () => USER_ID },
      updatePracticeQuestion: jest.fn().mockResolvedValue(mockUpdated),
    };

    PracticeQuestion.findById.mockResolvedValue(mockDoc);

    const req = {
      params: { id: "q1" },
      body: { question: "New" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.updatePracticeQuestion(req, res);

    expect(mockDoc.updatePracticeQuestion).toHaveBeenCalledWith(req.body);
    expect(res.json).toHaveBeenCalledWith(mockUpdated);
  });
});

// ------------------- deletePracticeQuestion -------------------
describe("deletePracticeQuestion", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 if not found", async () => {
    PracticeQuestion.findById.mockResolvedValue(null);

    const req = {
      params: { id: "q1" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.deletePracticeQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Practice question not found",
    });
  });

  test("returns 403 if not owner", async () => {
    PracticeQuestion.findById.mockResolvedValue({
      ownerID: { toString: () => "otherUser" },
    });

    const req = {
      params: { id: "q1" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.deletePracticeQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("deletes question", async () => {
    const mockSave = jest.fn().mockResolvedValue(true);

    const mockDoc = {
      _id: "q1",
      ownerID: { toString: () => USER_ID },
      hidden: false,
      save: mockSave,
    };

    PracticeQuestion.findById.mockResolvedValue(mockDoc);

    const req = {
      params: { id: "q1" },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.deletePracticeQuestion(req, res);

    expect(mockDoc.hidden).toBe(true);
    expect(mockSave).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Practice question removed from view",
    });
  });
});

// ------------------- generateMasteryPracticeTest -------------------
describe("generateMasteryPracticeTest", () => {
  let res;
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      OLLAMA_URL: "http://ollama.test/api/chat",
      OLLAMA_MODEL: "test-model",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    global.fetch && jest.restoreAllMocks();
  });

  test("does not require noteIds and can select hidden questions", async () => {
    PracticeQuestion.countDocuments.mockResolvedValue(1);

    const hiddenMissedQuestion = {
      _id: "qHidden",
      questionType: "free-response",
      question: "What is 2+2?",
      answer: "4",
      options: [],
      attempts: 2,
      correctAttempts: 1,
      lastAttemptedAt: new Date("2020-01-01"),
      generatedFromNoteId: "note1",
      hidden: true,
    };

    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([hiddenMissedQuestion]),
    };
    PracticeQuestion.find.mockReturnValue(chain);

    Note.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: "note1", ownerID: USER_ID, title: "T", content: "C" },
      ]),
    });

    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { content: JSON.stringify({ questions: [{ questionType: "free-response", question: "2+3?", answer: "5" }] }) },
      }),
    });

    const savedDocs = [{ _id: "new1", question: "2+3?" }];
    PracticeQuestion.insertMany.mockResolvedValue(savedDocs);

    const req = {
      body: { studyPlanId: "plan1", numQuestions: 1 },
      user: { userId: USER_ID },
    };

    await practiceQuestionController.generateMasteryPracticeTest(req, res);

    // First find() call must be the "missed" query and must NOT exclude hidden
    expect(PracticeQuestion.find).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerID: USER_ID,
        studyPlanId: "plan1",
        $expr: { $lt: ["$correctAttempts", "$attempts"] },
      })
    );

    expect(Note.find).toHaveBeenCalled();
    expect(PracticeQuestion.insertMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: savedDocs,
      })
    );
  });
});
