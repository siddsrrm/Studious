const noteController = require("../controllers/noteController");
const Note = require("../models/Note");

jest.mock("../models/Note");


const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";


//get notes
describe("searchNotes", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when tag query param is missing", async () => {
    const req = { query: {}, user: { userId: USER_ID } };

    await noteController.searchNotes(req, res);

    expect(Note.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "No tag provided" });
  });

  test("returns matching notes for a given tag", async () => {
    const mockNotes = [{ _id: "n1", tags: ["javascript"] }];
    Note.find.mockResolvedValue(mockNotes);

    const req = { query: { tag: "javascript" }, user: { userId: USER_ID } };

    await noteController.searchNotes(req, res);

    expect(Note.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      tags: { $elemMatch: { $regex: "javascript", $options: "i" } },
    });
    expect(res.json).toHaveBeenCalledWith(mockNotes);
  });

  test("search is case-insensitive", async () => {
    const mockNotes = [{ _id: "n1", tags: ["JavaScript"] }];
    Note.find.mockResolvedValue(mockNotes);

    const req = { query: { tag: "JAVASCRIPT" }, user: { userId: USER_ID } };

    await noteController.searchNotes(req, res);

    expect(Note.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      tags: { $elemMatch: { $regex: "JAVASCRIPT", $options: "i" } },
    });
    expect(res.json).toHaveBeenCalledWith(mockNotes);
  });

  test("returns empty array when no notes match the tag", async () => {
    Note.find.mockResolvedValue([]);

    const req = { query: { tag: "nonexistent" }, user: { userId: USER_ID } };

    await noteController.searchNotes(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns empty array when Note.find returns null", async () => {
    Note.find.mockResolvedValue(null);

    const req = { query: { tag: "sometag" }, user: { userId: USER_ID } };

    await noteController.searchNotes(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

});

describe("getNotes", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when studyPlanId is missing", async () => {
    const req = { query: {}, user: { userId: USER_ID } };

    await noteController.getNotes(req, res);

    expect(Note.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "studyPlanId is required" });
  });

  test("returns notes for the given study plan", async () => {
    const mockNotes = [{ _id: "n1", title: "Note 1" }];
    Note.find.mockResolvedValue(mockNotes);

    const req = {
      query: { studyPlanId: "plan1" },
      user: { userId: USER_ID },
    };

    await noteController.getNotes(req, res);

    expect(Note.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanID: "plan1",
    });
    expect(res.json).toHaveBeenCalledWith(mockNotes);
  });

});

// create notes

describe("createNote", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when studyPlanID is missing", async () => {
    const req = { body: { title: "My Note" }, user: { userId: USER_ID } };

    await noteController.createNote(req, res);

    expect(Note.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "studyPlanID is required" });
  });

  test("creates note with provided fields", async () => {
    const mockNote = {
      _id: "n1",
      ownerID: USER_ID,
      studyPlanID: "plan1",
      title: "Test Note",
      content: "Some content",
      tags: ["js"],
      folderId: "folder1",
    };
    Note.create.mockResolvedValue(mockNote);

    const req = {
      body: {
        studyPlanID: "plan1",
        title: "Test Note",
        content: "Some content",
        tags: ["js"],
        folderId: "folder1",
      },
      user: { userId: USER_ID },
    };

    await noteController.createNote(req, res);

    expect(Note.create).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanID: "plan1",
      title: "Test Note",
      content: "Some content",
      tags: ["js"],
      folderId: "folder1",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNote);
  });

  test("defaults title to 'Untitled' when title is empty", async () => {
    Note.create.mockResolvedValue({ _id: "n1", title: "Untitled" });

    const req = {
      body: { studyPlanID: "plan1", title: "" },
      user: { userId: USER_ID },
    };

    await noteController.createNote(req, res);

    expect(Note.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Untitled" })
    );
  });

  test("defaults folderId to '__unfiled__' when not provided", async () => {
    Note.create.mockResolvedValue({ _id: "n1", folderId: "__unfiled__" });

    const req = {
      body: { studyPlanID: "plan1" },
      user: { userId: USER_ID },
    };

    await noteController.createNote(req, res);

    expect(Note.create).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "__unfiled__" })
    );
  });


// update notes

describe("updateNote", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 when note does not exist", async () => {
    Note.findById.mockResolvedValue(null);

    const req = {
      params: { id: "n1" },
      body: { title: "Updated" },
      user: { userId: USER_ID },
    };

    await noteController.updateNote(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Note not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Note.findById.mockResolvedValue({
      _id: "n1",
      ownerID: { toString: () => "otherUser" },
      save: jest.fn(),
    });

    const req = {
      params: { id: "n1" },
      body: { title: "Updated" },
      user: { userId: USER_ID },
    };

    await noteController.updateNote(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("updates all provided fields and saves", async () => {
    const mockNote = {
      _id: "n1",
      ownerID: { toString: () => USER_ID },
      title: "Old Title",
      content: "Old content",
      tags: [],
      folderId: "__unfiled__",
      save: jest.fn().mockResolvedValue(true),
    };
    Note.findById.mockResolvedValue(mockNote);

    const req = {
      params: { id: "n1" },
      body: { title: "New Title", content: "New content", tags: ["react"], folderId: "folder1" },
      user: { userId: USER_ID },
    };

    await noteController.updateNote(req, res);

    expect(mockNote.title).toBe("New Title");
    expect(mockNote.content).toBe("New content");
    expect(mockNote.tags).toEqual(["react"]);
    expect(mockNote.folderId).toBe("folder1");
    expect(mockNote.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockNote);
  });

});

// delete notes

describe("deleteNote", () => {
  let res;

  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 when note does not exist", async () => {
    Note.findById.mockResolvedValue(null);

    const req = { params: { id: "n1" }, user: { userId: USER_ID } };

    await noteController.deleteNote(req, res);

    expect(Note.deleteOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Note not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Note.findById.mockResolvedValue({
      _id: "n1",
      ownerID: { toString: () => "otherUser" },
    });

    const req = { params: { id: "n1" }, user: { userId: USER_ID } };

    await noteController.deleteNote(req, res);

    expect(Note.deleteOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("deletes the note and returns success message", async () => {
    const mockNote = { _id: "n1", ownerID: { toString: () => USER_ID } };
    Note.findById.mockResolvedValue(mockNote);
    Note.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const req = { params: { id: "n1" }, user: { userId: USER_ID } };

    await noteController.deleteNote(req, res);

    expect(Note.deleteOne).toHaveBeenCalledWith({ _id: "n1" });
    expect(res.json).toHaveBeenCalledWith({ message: "Note deleted" });
  });
  
});

});
