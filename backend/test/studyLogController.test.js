const { updateLogs, getLogs } = require("../controllers/studyLogController.js");

jest.mock("../models/StudyLog");

const StudyLog = require("../models/StudyLog");

function mockReq(overrides = {}) {
  return {
    user: { userId: "user123" },
    body: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("updateLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a log and returns 201 on success", async () => {
    const fakeLog = {
      _id: "log123",
      user: "user123",
      planId: "plan456",
      planTitle: "Math Study",
      date: new Date("2024-01-01"),
      durationMins: 60,
    };
    StudyLog.create.mockResolvedValue(fakeLog);

    const req = mockReq({
      body: { planId: "plan456", planTitle: "Math Study", date: "2024-01-01", durationMins: 60 },
    });
    const res = mockRes();

    await updateLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Log saved.", log: fakeLog });
  });

  test("calls StudyLog.create with correct fields", async () => {
    StudyLog.create.mockResolvedValue({});

    const req = mockReq({
      body: { planId: "plan456", planTitle: "Math Study", date: "2024-01-01", durationMins: 60 },
    });
    const res = mockRes();

    await updateLogs(req, res);

    expect(StudyLog.create).toHaveBeenCalledWith({
      user: "user123",
      planId: "plan456",
      planTitle: "Math Study",
      date: "2024-01-01",
      durationMins: 60,
    });
  });

  test("uses current date when no date is provided", async () => {
    StudyLog.create.mockResolvedValue({});

    const req = mockReq({
      body: { planId: "plan456", durationMins: 30 },
    });
    const res = mockRes();

    const before = Date.now();
    await updateLogs(req, res);
    const after = Date.now();

    const createdWith = StudyLog.create.mock.calls[0][0];
    expect(createdWith.date).toBeInstanceOf(Date);
    expect(createdWith.date.getTime()).toBeGreaterThanOrEqual(before);
    expect(createdWith.date.getTime()).toBeLessThanOrEqual(after);
  });

  test("returns 400 when planId is missing", async () => {
    const req = mockReq({ body: { durationMins: 60 } });
    const res = mockRes();

    await updateLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "planId and durationMins are required.",
    });
    expect(StudyLog.create).not.toHaveBeenCalled();
  });

  test("returns 400 when durationMins is missing", async () => {
    const req = mockReq({ body: { planId: "plan456" } });
    const res = mockRes();

    await updateLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "planId and durationMins are required.",
    });
    expect(StudyLog.create).not.toHaveBeenCalled();
  });

  test("returns 400 when both planId and durationMins are missing", async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await updateLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(StudyLog.create).not.toHaveBeenCalled();
  });

  test("returns 500 when StudyLog.create throws", async () => {
    StudyLog.create.mockRejectedValue(new Error("DB error"));

    const req = mockReq({
      body: { planId: "plan456", durationMins: 60 },
    });
    const res = mockRes();

    await updateLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "server error" });
  });
});

describe("getLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns logs sorted by date descending", async () => {
    const fakeLogs = [
      { _id: "log2", user: "user123", durationMins: 30, date: new Date("2024-02-01") },
      { _id: "log1", user: "user123", durationMins: 60, date: new Date("2024-01-01") },
    ];
    StudyLog.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeLogs) });

    const req = mockReq();
    const res = mockRes();

    await getLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeLogs);
  });

  test("calls StudyLog.find with the correct userId", async () => {
    StudyLog.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

    const req = mockReq();
    const res = mockRes();

    await getLogs(req, res);

    expect(StudyLog.find).toHaveBeenCalledWith({ user: "user123" });
  });

  test("sorts results by date descending", async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    StudyLog.find.mockReturnValue({ sort: sortMock });

    const req = mockReq();
    const res = mockRes();

    await getLogs(req, res);

    expect(sortMock).toHaveBeenCalledWith({ date: -1 });
  });

  test("returns empty array when user has no logs", async () => {
    StudyLog.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

    const req = mockReq();
    const res = mockRes();

    await getLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 when StudyLog.find throws", async () => {
    StudyLog.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockReq();
    const res = mockRes();

    await getLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error." });
  });
});