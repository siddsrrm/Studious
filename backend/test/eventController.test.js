const eventController = require("../controllers/eventController");
const Event = require("../models/Event");

jest.mock("../models/Event");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

// ------------------- getEvents -------------------
describe("getEvents", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns events for user", async () => {
    const mockEvents = [
      { _id: "e1", title: "Test Event", start: "1", end: "2" },
    ];

    Event.find.mockResolvedValue(mockEvents);

    const req = {
      user: { userId: USER_ID },
    };

    await eventController.getEvents(req, res);

    expect(Event.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
    });
    expect(res.json).toHaveBeenCalledWith(mockEvents);
  });

  test("handles server error", async () => {
    Event.find.mockRejectedValue(new Error("DB error"));

    const req = {
      user: { userId: USER_ID },
    };

    await eventController.getEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "DB error",
    });
  });
});

// ------------------- createEvent -------------------
describe("createEvent", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("creates event", async () => {
    const mockSaved = {
      _id: "e1",
      title: "Test",
      start: "1",
      end: "2",
    };

    const saveMock = jest.fn().mockResolvedValue(mockSaved);

    Event.mockImplementation(() => ({
      save: saveMock,
    }));

    const req = {
      body: { title: "Test", start: "1", end: "2" },
      user: { userId: USER_ID },
    };

    await eventController.createEvent(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockSaved);
  });

  test("handles server error", async () => {
    const saveMock = jest.fn().mockRejectedValue(new Error("Save failed"));

    Event.mockImplementation(() => ({
      save: saveMock,
    }));

    const req = {
      body: { title: "Test", start: "1", end: "2" },
      user: { userId: USER_ID },
    };

    await eventController.createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Save failed",
    });
  });
});

// ------------------- updateEvent -------------------
describe("updateEvent", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 if event not found", async () => {
    Event.findById.mockResolvedValue(null);

    const req = {
      params: { id: "e1" },
      body: {},
      user: { userId: USER_ID },
    };

    await eventController.updateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Event not found",
    });
  });

  test("returns 403 if not owner", async () => {
    Event.findById.mockResolvedValue({
      ownerID: { toString: () => "otherUser" },
    });

    const req = {
      params: { id: "e1" },
      body: {},
      user: { userId: USER_ID },
    };

    await eventController.updateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden",
    });
  });

  test("updates event fields and returns updated event", async () => {
    const saveMock = jest.fn().mockResolvedValue({
      _id: "e1",
      title: "Updated",
      start: "10",
      end: "20",
    });

    const mockEvent = {
      ownerID: { toString: () => USER_ID },
      title: "Old",
      start: "1",
      end: "2",
      save: saveMock,
    };

    Event.findById.mockResolvedValue(mockEvent);

    const req = {
      params: { id: "e1" },
      body: { title: "Updated", start: "10", end: "20" },
      user: { userId: USER_ID },
    };

    await eventController.updateEvent(req, res);

    expect(mockEvent.title).toBe("Updated");
    expect(mockEvent.start).toBe("10");
    expect(mockEvent.end).toBe("20");
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test("handles server error", async () => {
    Event.findById.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { id: "e1" },
      body: {},
      user: { userId: USER_ID },
    };

    await eventController.updateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------- deleteEvent -------------------
describe("deleteEvent", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 if not found", async () => {
    Event.findById.mockResolvedValue(null);

    const req = {
      params: { id: "e1" },
      user: { userId: USER_ID },
    };

    await eventController.deleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Event not found",
    });
  });

  test("returns 403 if not owner", async () => {
    Event.findById.mockResolvedValue({
      ownerID: { toString: () => "otherUser" },
    });

    const req = {
      params: { id: "e1" },
      user: { userId: USER_ID },
    };

    await eventController.deleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden",
    });
  });

  test("deletes event", async () => {
    Event.findById.mockResolvedValue({
      _id: "e1",
      ownerID: { toString: () => USER_ID },
    });

    Event.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const req = {
      params: { id: "e1" },
      user: { userId: USER_ID },
    };

    await eventController.deleteEvent(req, res);

    expect(Event.deleteOne).toHaveBeenCalledWith({ _id: "e1" });
    expect(res.json).toHaveBeenCalledWith({
      message: "Event deleted",
    });
  });

  test("handles server error", async () => {
    Event.findById.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { id: "e1" },
      user: { userId: USER_ID },
    };

    await eventController.deleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});