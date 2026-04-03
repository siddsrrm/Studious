const studyPlanController = require("../controllers/studyPlanController");
const StudyPlan = require("../models/StudyPlan");

jest.mock("../models/StudyPlan");
jest.mock("../models/Task");
jest.mock("../models/ProgressTracker");

const Task = require("../models/Task");
const ProgressTracker = require("../models/ProgressTracker");

describe("createStudyPlan", () => {
    let res;
    beforeEach(() => {
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    test("should return 400 if title is missing", async () => {
        const req = { body: {}, user: { userId: "user123" } };
        await studyPlanController.createStudyPlan(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Title is required" });
    });

    test("should return 400 if title is blank whitespace", async () => {
        const req = { body: { title: "   " }, user: { userId: "user123" } };
        await studyPlanController.createStudyPlan(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Title is required" });
    });

    test("should create a study plan with title and description", async () => {
        const mockPlan = {
            _id: "plan123",
            owner: "user123",
            title: "My Plan",
            description: "A description",
            save: jest.fn().mockResolvedValue(true)
        };
        StudyPlan.mockImplementation(() => mockPlan);
        const req = {
            body: { title: "My Plan", description: "A description" },
            user: { userId: "user123" }
        };
        await studyPlanController.createStudyPlan(req, res);
        expect(mockPlan.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: "Study plan created",
            studyPlan: mockPlan
        });
    });

    test("should trim title and description before saving", async () => {
        const mockPlan = {
            owner: "user123",
            title: "My Plan",
            description: "A description",
            save: jest.fn().mockResolvedValue(true)
        };
        StudyPlan.mockImplementation((data) => {
            expect(data.title).toBe("My Plan");
            expect(data.description).toBe("A description");
            return mockPlan;
        });
        const req = {
            body: { title: "  My Plan  ", description: "  A description  " },
            user: { userId: "user123" }
        };
        await studyPlanController.createStudyPlan(req, res);
        expect(mockPlan.save).toHaveBeenCalled();
    });

    test("should default description to empty string if not provided", async () => {
        const mockPlan = { save: jest.fn().mockResolvedValue(true) };
        StudyPlan.mockImplementation((data) => {
            expect(data.description).toBe("");
            return mockPlan;
        });
        const req = { body: { title: "My Plan" }, user: { userId: "user123" } };
        await studyPlanController.createStudyPlan(req, res);
        expect(mockPlan.save).toHaveBeenCalled();
    });

    test("should return 500 on server error", async () => {
        StudyPlan.mockImplementation(() => {
            throw new Error("DB error");
        });
        const req = { body: { title: "My Plan" }, user: { userId: "user123" } };
        await studyPlanController.createStudyPlan(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("getUserStudyPlans", () => {
    let res;
    beforeEach(() => {
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    test("should return all study plans for the user", async () => {
        const mockPlans = [
            { _id: "plan1", title: "Plan 1" },
            { _id: "plan2", title: "Plan 2" }
        ];
        StudyPlan.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockPlans) });
        const req = { user: { userId: "user123" } };
        await studyPlanController.getUserStudyPlans(req, res);
        expect(StudyPlan.find).toHaveBeenCalledWith({ owner: "user123" });
        expect(res.json).toHaveBeenCalledWith(mockPlans);
    });

    test("should return empty array if user has no study plans", async () => {
        StudyPlan.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        const req = { user: { userId: "user123" } };
        await studyPlanController.getUserStudyPlans(req, res);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test("should return 500 on server error", async () => {
        StudyPlan.find.mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error("DB error")) });
        const req = { user: { userId: "user123" } };
        await studyPlanController.getUserStudyPlans(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("deleteStudyPlan", () => {
    let res;
    beforeEach(() => {
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    test("should return 404 if study plan is not found", async () => {
        StudyPlan.findById.mockResolvedValue(null);
        const req = { params: { id: "plan123" }, user: { userId: "user123" } };
        await studyPlanController.deleteStudyPlan(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Study plan not found" });
    });

    test("should return 403 if user does not own the study plan", async () => {
        StudyPlan.findById.mockResolvedValue({
            owner: { toString: () => "otheruser" }
        });
        const req = { params: { id: "plan123" }, user: { userId: "user123" } };
        await studyPlanController.deleteStudyPlan(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    test("should delete the study plan and return success", async () => {
        const mockPlan = { _id: "plan123", owner: { toString: () => "user123" } };
        StudyPlan.findById.mockResolvedValue(mockPlan);
        StudyPlan.deleteOne.mockResolvedValue({});
        Task.deleteMany.mockResolvedValue({});
        ProgressTracker.findOne.mockResolvedValue({
            planStats: [],
            calculateUserScore: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
        });
        const req = { params: { id: "plan123" }, user: { userId: "user123" } };
        await studyPlanController.deleteStudyPlan(req, res);
        expect(StudyPlan.deleteOne).toHaveBeenCalledWith({ _id: "plan123" });
        expect(res.json).toHaveBeenCalledWith({ message: "Study plan deleted" });
    });

    test("should return 500 on server error", async () => {
        StudyPlan.findById.mockRejectedValue(new Error("DB error"));
        const req = { params: { id: "plan123" }, user: { userId: "user123" } };
        await studyPlanController.deleteStudyPlan(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});