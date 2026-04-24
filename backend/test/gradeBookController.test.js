const gradeBookController = require("../controllers/gradeBookController");
const GradeBook = require("../models/GradeBook");

jest.mock("../models/GradeBook");

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

const USER_ID = "user123";
const STUDY_PLAN_ID = "plan456";

describe("GradeBook Controller", () => {
    let res;

    beforeEach(() => {
        res = makeRes();
        jest.clearAllMocks();
    });

    describe("getGradeBook", () => {
        test("returns existing grade book and calculated grade", async () => {
            const mockGradeBook = {
                entries: [{ title: "Quiz 1", score: 90 }],
                calculateOverallGrade: jest.fn().mockReturnValue(90),
            };
            GradeBook.findOne.mockResolvedValue(mockGradeBook);

            const req = {
                params: { studyPlanId: STUDY_PLAN_ID },
                user: { userId: USER_ID },
            };

            await gradeBookController.getGradeBook(req, res);

            expect(GradeBook.findOne).toHaveBeenCalledWith({
                studyPlanID: STUDY_PLAN_ID,
                userID: USER_ID,
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                entries: mockGradeBook.entries,
                overallGrade: 90,
            });
        });

        test("creates a new grade book if none exists", async () => {
            GradeBook.findOne.mockResolvedValue(null);
            const mockCreated = {
                entries: [],
                calculateOverallGrade: jest.fn().mockReturnValue(0),
            };
            GradeBook.create.mockResolvedValue(mockCreated);

            const req = {
                params: { studyPlanId: STUDY_PLAN_ID },
                user: { userId: USER_ID },
            };

            await gradeBookController.getGradeBook(req, res);

            expect(GradeBook.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe("addEntry", () => {
        test("returns 400 if title is missing", async () => {
            const req = { body: { score: 90, type: "exam" }, user: { userId: USER_ID } };
            await gradeBookController.addEntry(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Title is required." });
        });

        test("returns 400 if type is invalid", async () => {
            const req = {
                body: { title: "Test", type: "homework", score: 50 },
                user: { userId: USER_ID }
            };
            await gradeBookController.addEntry(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("adds entry to existing grade book and saves", async () => {
            const mockGradeBook = {
                entries: { push: jest.fn() },
                save: jest.fn().mockResolvedValue(true),
                calculateOverallGrade: jest.fn().mockReturnValue(85),
            };
            GradeBook.findOne.mockResolvedValue(mockGradeBook);

            const req = {
                params: { studyPlanId: STUDY_PLAN_ID },
                user: { userId: USER_ID },
                body: { title: "Midterm", type: "exam", score: 85, weight: 20 },
            };

            await gradeBookController.addEntry(req, res);

            expect(mockGradeBook.entries.push).toHaveBeenCalledWith(
                expect.objectContaining({ title: "Midterm", score: 85 })
            );
            expect(mockGradeBook.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe("updateEntry", () => {
        test("returns 404 if grade book not found", async () => {
            GradeBook.findOne.mockResolvedValue(null);
            const req = {
                params: { studyPlanId: "1", entryId: "2" },
                body: { score: 10 },
                user: { userId: USER_ID }
            };
            await gradeBookController.updateEntry(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Grade book not found." });
        });

        test("updates specific entry fields and saves", async () => {
            const mockEntry = { title: "Old" };
            const mockGradeBook = {
                entries: { id: jest.fn().mockReturnValue(mockEntry) },
                save: jest.fn().mockResolvedValue(true),
                calculateOverallGrade: jest.fn().mockReturnValue(100),
            };
            GradeBook.findOne.mockResolvedValue(mockGradeBook);

            const req = {
                params: { studyPlanId: STUDY_PLAN_ID, entryId: "entry1" },
                user: { userId: USER_ID },
                body: { title: "New Title", score: 100 },
            };

            await gradeBookController.updateEntry(req, res);

            expect(mockEntry.title).toBe("New Title");
            expect(mockGradeBook.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe("deleteEntry", () => {
        test("removes entry using pull and saves", async () => {
            const mockEntry = { _id: "entry1" };
            const mockGradeBook = {
                entries: {
                    id: jest.fn().mockReturnValue(mockEntry),
                    pull: jest.fn()
                },
                save: jest.fn().mockResolvedValue(true),
                calculateOverallGrade: jest.fn().mockReturnValue(0),
            };
            GradeBook.findOne.mockResolvedValue(mockGradeBook);

            const req = {
                params: { studyPlanId: STUDY_PLAN_ID, entryId: "entry1" },
                user: { userId: USER_ID },
            };

            await gradeBookController.deleteEntry(req, res);

            expect(mockGradeBook.entries.pull).toHaveBeenCalledWith({ _id: "entry1" });
            expect(mockGradeBook.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("returns 404 if entry does not exist", async () => {
            const mockGradeBook = {
                entries: { id: jest.fn().mockReturnValue(null) }
            };
            GradeBook.findOne.mockResolvedValue(mockGradeBook);

            const req = {
                params: { studyPlanId: STUDY_PLAN_ID, entryId: "invalid" },
                user: { userId: USER_ID }
            };
            await gradeBookController.deleteEntry(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Entry not found." });
        });
    });
});