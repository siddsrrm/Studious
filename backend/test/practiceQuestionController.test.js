const practiceQuestionController = require("../controllers/practiceQuestionController");
const PracticeQuestion = require("../models/PracticeQuestion");

jest.mock("../models/PracticeQuestion");

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

const USER_ID = "user123";

describe("PracticeQuestion Controller", () => {
    let res;

    beforeEach(() => {
        res = makeRes();
        jest.clearAllMocks();
    });

    // --- getPracticeQuestions ---
    describe("getPracticeQuestions", () => {
        test("returns 400 when studyPlanId is missing", async () => {
            const req = { query: {}, user: { userId: USER_ID } };

            await practiceQuestionController.getPracticeQuestions(req, res);

            expect(PracticeQuestion.find).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "studyPlanId is required" });
        });

        test("returns practice questions for a valid study plan", async () => {
            const mockQuestions = [{ _id: "q1", question: "What is Node?" }];
            PracticeQuestion.find.mockResolvedValue(mockQuestions);

            const req = {
                query: { studyPlanId: "plan1" },
                user: { userId: USER_ID }
            };

            await practiceQuestionController.getPracticeQuestions(req, res);

            expect(PracticeQuestion.find).toHaveBeenCalledWith({
                ownerID: USER_ID,
                studyPlanId: "plan1",
            });
            expect(res.json).toHaveBeenCalledWith(mockQuestions);
        });
    });

    // --- createPracticeQuestion ---
    describe("createPracticeQuestion", () => {
        test("returns 400 if required fields are missing", async () => {
            const req = {
                body: { studyPlanId: "plan1" }, // missing question/answer
                user: { userId: USER_ID }
            };

            await practiceQuestionController.createPracticeQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Question and answer required" });
        });

        test("successfully creates a practice question", async () => {
            const mockPayload = {
                studyPlanId: "plan1",
                question: "1+1?",
                answer: "2"
            };
            PracticeQuestion.create.mockResolvedValue({ ...mockPayload, ownerID: USER_ID });

            const req = { body: mockPayload, user: { userId: USER_ID } };

            await practiceQuestionController.createPracticeQuestion(req, res);

            expect(PracticeQuestion.create).toHaveBeenCalledWith({
                ownerID: USER_ID,
                ...mockPayload,
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    // --- updatePracticeQuestion ---
    describe("updatePracticeQuestion", () => {
        test("returns 403 if question not found or user is not owner", async () => {
            PracticeQuestion.findById.mockResolvedValue(null);
            const req = {
                params: { id: "q1" },
                user: { userId: USER_ID },
                body: { question: "New?" }
            };

            await practiceQuestionController.updatePracticeQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
        });

        test("calls updatePracticeQuestion model method and returns result", async () => {
            const mockQuestion = {
                ownerID: { toString: () => USER_ID },
                updatePracticeQuestion: jest.fn().mockResolvedValue({ question: "Updated" })
            };
            PracticeQuestion.findById.mockResolvedValue(mockQuestion);

            const req = {
                params: { id: "q1" },
                user: { userId: USER_ID },
                body: { question: "Updated" }
            };

            await practiceQuestionController.updatePracticeQuestion(req, res);

            expect(mockQuestion.updatePracticeQuestion).toHaveBeenCalledWith(req.body);
            expect(res.json).toHaveBeenCalledWith({ question: "Updated" });
        });
    });

    // --- deletePracticeQuestion ---
    describe("deletePracticeQuestion", () => {
        test("returns 404 if practice question does not exist", async () => {
            PracticeQuestion.findById.mockResolvedValue(null);
            const req = { params: { id: "q1" }, user: { userId: USER_ID } };

            await practiceQuestionController.deletePracticeQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Practice question not found" });
        });

        test("returns 403 if user is not the owner", async () => {
            PracticeQuestion.findById.mockResolvedValue({
                ownerID: { toString: () => "stranger" }
            });
            const req = { params: { id: "q1" }, user: { userId: USER_ID } };

            await practiceQuestionController.deletePracticeQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test("deletes question when owner is verified", async () => {
            const mockQuestion = {
                _id: "q1",
                ownerID: { toString: () => USER_ID }
            };
            PracticeQuestion.findById.mockResolvedValue(mockQuestion);
            // Mock deleteOne to resolve successfully
            PracticeQuestion.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const req = { params: { id: "q1" }, user: { userId: USER_ID } };

            await practiceQuestionController.deletePracticeQuestion(req, res);

            expect(PracticeQuestion.deleteOne).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: "Practice question deleted" });
        });
    });
});