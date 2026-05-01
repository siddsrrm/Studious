const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

jest.mock("../models/Attachment", () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

const Attachment = require("../models/Attachment");
const attachmentController = require("../controllers/attachmentController");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

const makeReq = (overrides = {}) => ({
  user: { userId: USER_ID },
  query: {},
  body: {},
  params: {},
  ...overrides,
});

describe("getAttachments", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when taskId is missing", async () => {
    const req = makeReq({ query: {} });

    await attachmentController.getAttachments(req, res);

    expect(Attachment.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "taskId is required",
    });
  });

  test("returns attachments", async () => {
    const mockData = [{ _id: "a1", type: "link" }];
    Attachment.find.mockResolvedValue(mockData);

    const req = makeReq({ query: { taskId: "task1" } });

    await attachmentController.getAttachments(req, res);

    expect(Attachment.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      taskId: "task1",
    });

    expect(res.json).toHaveBeenCalledWith(mockData);
  });
});

describe("createAttachment", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
    Attachment.findOne = jest.fn();
    fsp.writeFile.mockResolvedValue();
  });

  test("returns 400 if taskId missing", async () => {
    const req = makeReq({ body: {} });

    await attachmentController.createAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 for invalid type", async () => {
    const req = makeReq({
      body: { taskId: "t1", type: "bad" },
    });

    await attachmentController.createAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid attachment type",
    });
  });

  test("creates link attachment", async () => {
    const mockAttachment = {
      _id: "a1",
      type: "link",
      url: "https://google.com",
    };

    Attachment.create.mockResolvedValue(mockAttachment);

    const req = makeReq({
      body: {
        taskId: "t1",
        type: "link",
        url: "https://google.com",
      },
    });

    await attachmentController.createAttachment(req, res);

    expect(Attachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerID: USER_ID,
        taskId: "t1",
        type: "link",
        url: "https://google.com",
      }),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockAttachment);
  });

  test("creates file attachment", async () => {
    const mockAttachment = {
      _id: "a2",
      type: "file",
    };

    Attachment.create.mockResolvedValue(mockAttachment);

    const req = makeReq({
      user: { userId: USER_ID },
      body: {
        taskId: "t1",
        type: "file",
      },
      file: {
        originalname: "test.pdf",
        path: "/data/assets/test.pdf",
        size: 100,
        mimetype: "application/pdf",
      },
    });

    await attachmentController.createAttachment(req, res);

    expect(Attachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerID: USER_ID,
        taskId: "t1",
        type: "file",
      }),
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("updateAttachment", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
    Attachment.findById = jest.fn();
    Attachment.deleteOne = jest.fn();
  });

  test("returns 404 if not found", async () => {
    Attachment.findById.mockResolvedValue(null);

    const req = makeReq({ params: { id: "a1" } });

    await attachmentController.updateAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 if not owner", async () => {
    Attachment.findById.mockResolvedValue({
      ownerID: { toString: () => "other" },
    });

    const req = makeReq({ params: { id: "a1" } });

    await attachmentController.updateAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("updates attachment", async () => {
    const updated = { _id: "a1", url: "new" };

    const mockDoc = {
      ownerID: { toString: () => USER_ID },
      updateAttachment: jest.fn().mockResolvedValue(updated),
    };

    Attachment.findById.mockResolvedValue(mockDoc);

    const req = makeReq({
      params: { id: "a1" },
      body: { url: "new" },
    });

    await attachmentController.updateAttachment(req, res);

    expect(mockDoc.updateAttachment).toHaveBeenCalledWith(req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

describe("deleteAttachment", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
    Attachment.findById = jest.fn();
    Attachment.deleteOne = jest.fn();
    fs.existsSync.mockReturnValue(true);
  });

  test("returns 404 if not found", async () => {
    Attachment.findById.mockResolvedValue(null);

    const req = makeReq({ params: { id: "a1" } });

    await attachmentController.deleteAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 if not owner", async () => {
    Attachment.findById.mockResolvedValue({
      ownerID: { toString: () => "other" },
    });

    const req = makeReq({ params: { id: "a1" } });

    await attachmentController.deleteAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("deletes file + DB record", async () => {
    const mockAttachment = {
      type: "file",
      fileUrl: "/uploads/test.pdf",
      ownerID: { toString: () => USER_ID },
    };

    Attachment.findById.mockResolvedValue(mockAttachment);
    Attachment.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const req = makeReq({ params: { id: "a1" } });

    await attachmentController.deleteAttachment(req, res);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(Attachment.deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Attachment deleted",
    });
  });
});
