const folderController = require("../controllers/folderController");
const Folder = require("../models/Folder");

jest.mock("../models/Folder");

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

const USER_ID = "user123";

describe("getFolders", () => {
    let res;
    beforeEach(() => {
        res = makeRes();
        jest.clearAllMocks();
    });

    test("returns 400 when studyPlanId is missing", async () => {
        const req = { query: {}, user: { userId: USER_ID } };
        await folderController.getFolders(req, res);
        expect(Folder.find).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "studyPlanId is required" });
    });

    test("returns folders for the given study plan", async () => {
        const mockFolders = [
            { _id: "f1", name: "Folder 1" },
            { _id: "f2", name: "Folder 2" }
        ];
        Folder.find.mockResolvedValue(mockFolders);
        const req = { query: { studyPlanId: "plan1" }, user: { userId: USER_ID } };
        await folderController.getFolders(req, res);
        expect(Folder.find).toHaveBeenCalledWith({
            ownerID: USER_ID,
            studyPlanID: "plan1",
        });
        expect(res.json).toHaveBeenCalledWith(mockFolders);
    });

    test("returns empty array when no folders exist", async () => {
        Folder.find.mockResolvedValue([]);
        const req = { query: { studyPlanId: "plan1" }, user: { userId: USER_ID } };
        await folderController.getFolders(req, res);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test("returns 500 on server error", async () => {
        Folder.find.mockRejectedValue(new Error("DB error"));
        const req = { query: { studyPlanId: "plan1" }, user: { userId: USER_ID } };
        await folderController.getFolders(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("createFolder", () => {
    let res;
    beforeEach(() => {
        res = makeRes();
        jest.clearAllMocks();
    });

    test("returns 400 when studyPlanID is missing", async () => {
        const req = { body: { name: "My Folder" }, user: { userId: USER_ID } };
        await folderController.createFolder(req, res);
        expect(Folder.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "studyPlanID and name are required" });
    });

    test("returns 400 when name is missing", async () => {
        const req = { body: { studyPlanID: "plan1" }, user: { userId: USER_ID } };
        await folderController.createFolder(req, res);
        expect(Folder.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "studyPlanID and name are required" });
    });

    test("returns 400 when both studyPlanID and name are missing", async () => {
        const req = { body: {}, user: { userId: USER_ID } };
        await folderController.createFolder(req, res);
        expect(Folder.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "studyPlanID and name are required" });
    });

    test("creates folder with trimmed name", async () => {
        const mockFolder = {
            _id: "f1",
            ownerID: USER_ID,
            studyPlanID: "plan1",
            name: "My Folder",
        };
        Folder.create.mockResolvedValue(mockFolder);
        const req = {
            body: { studyPlanID: "plan1", name: "  My Folder  " },
            user: { userId: USER_ID },
        };
        await folderController.createFolder(req, res);
        expect(Folder.create).toHaveBeenCalledWith({
            ownerID: USER_ID,
            studyPlanID: "plan1",
            name: "My Folder",
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockFolder);
    });

    test("returns 500 on server error", async () => {
        Folder.create.mockRejectedValue(new Error("DB error"));
        const req = {
            body: { studyPlanID: "plan1", name: "My Folder" },
            user: { userId: USER_ID },
        };
        await folderController.createFolder(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("deleteFolder", () => {
    let res;
    beforeEach(() => {
        res = makeRes();
        jest.clearAllMocks();
    });

    test("returns 404 when folder does not exist", async () => {
        Folder.findById.mockResolvedValue(null);
        const req = { params: { id: "f1" }, user: { userId: USER_ID } };
        await folderController.deleteFolder(req, res);
        expect(Folder.deleteOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Folder not found" });
    });

    test("returns 403 when user does not own the folder", async () => {
        Folder.findById.mockResolvedValue({
            _id: "f1",
            ownerID: { toString: () => "otherUser" },
        });
        const req = { params: { id: "f1" }, user: { userId: USER_ID } };
        await folderController.deleteFolder(req, res);
        expect(Folder.deleteOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    test("deletes the folder and returns success message", async () => {
        const mockFolder = { _id: "f1", ownerID: { toString: () => USER_ID } };
        Folder.findById.mockResolvedValue(mockFolder);
        Folder.deleteOne.mockResolvedValue({ deletedCount: 1 });
        const req = { params: { id: "f1" }, user: { userId: USER_ID } };
        await folderController.deleteFolder(req, res);
        expect(Folder.deleteOne).toHaveBeenCalledWith({ _id: "f1" });
        expect(res.json).toHaveBeenCalledWith({ message: "Folder deleted" });
    });

    test("returns 500 on server error", async () => {
        Folder.findById.mockRejectedValue(new Error("DB error"));
        const req = { params: { id: "f1" }, user: { userId: USER_ID } };
        await folderController.deleteFolder(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});