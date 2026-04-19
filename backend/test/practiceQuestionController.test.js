const practiceQuestionController = require("../controllers/practiceQuestionController");
const PracticeQuestion = require("../models/PracticeQuestion");

jest.mock("../models/PracticeQuestion");

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
