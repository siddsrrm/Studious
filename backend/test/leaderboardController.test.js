const leaderboardController = require("../controllers/leaderboardController");
const Leaderboard = require("../models/Leaderboard");
const ProgressTracker = require("../models/ProgressTracker");

jest.mock("../models/Leaderboard");
jest.mock("../models/ProgressTracker");

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

describe("Leaderboard Controller", () => {
    let res;
    let consoleErrorSpy;

    beforeEach(() => {
        res = makeRes();
        jest.clearAllMocks();

        // Some controller paths intentionally log errors; keep test output clean.
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy?.mockRestore?.();
    });

    // Mock data for shared use
    const mockTrackers = [
        {
            userID: { _id: "user1", username: "PlayerOne" },
            overallcompletion: 85,
        },
        {
            userID: { _id: "user2", username: "PlayerTwo" },
            overallcompletion: 92,
        },
        {
            userID: null, // Test case for skipped deleted users
            overallcompletion: 50,
        }
    ];

    const mockLeaderboardInstance = {
        userRankings: [],
        lastRefreshTime: new Date(),
        updateUserScore: jest.fn().mockResolvedValue(true),
        recalculateRankings: jest.fn().mockResolvedValue(true),
        getTopUsers: jest.fn().mockReturnValue([
            { username: "PlayerTwo", score: 92, rank: 1 },
            { username: "PlayerOne", score: 85, rank: 2 }
        ])
    };

    describe("getLeaderboard", () => {
        test("successfully calculates and returns the leaderboard", async () => {
            // Setup Mocks
            ProgressTracker.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockTrackers)
            });
            Leaderboard.findOne.mockResolvedValue(mockLeaderboardInstance);

            const req = {};

            await leaderboardController.getLeaderboard(req, res);

            // Verify calculation logic
            expect(ProgressTracker.find).toHaveBeenCalled();
            expect(mockLeaderboardInstance.updateUserScore).toHaveBeenCalledTimes(2); // Skipped the null userID
            expect(mockLeaderboardInstance.updateUserScore).toHaveBeenCalledWith("user1", "PlayerOne", 85);
            expect(mockLeaderboardInstance.recalculateRankings).toHaveBeenCalled();

            // Verify response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                rankings: mockLeaderboardInstance.getTopUsers(),
                lastRefreshTime: mockLeaderboardInstance.lastRefreshTime,
            });
        });

        test("creates a new leaderboard if one doesn't exist", async () => {
            ProgressTracker.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            });
            Leaderboard.findOne.mockResolvedValue(null);

            // Mock the constructor behavior
            Leaderboard.mockImplementation(() => mockLeaderboardInstance);

            await leaderboardController.getLeaderboard({}, res);

            expect(Leaderboard).toHaveBeenCalledWith({ userRankings: [] });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("returns 500 when database error occurs", async () => {
            ProgressTracker.find.mockImplementation(() => {
                throw new Error("Database connection failed");
            });

            await leaderboardController.getLeaderboard({}, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch leaderboard." });
        });
    });

    describe("refreshLeaderboard", () => {
        test("successfully refreshes and returns success message", async () => {
            ProgressTracker.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockTrackers)
            });
            Leaderboard.findOne.mockResolvedValue(mockLeaderboardInstance);

            const req = {};

            await leaderboardController.refreshLeaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Leaderboard refreshed.",
                rankings: mockLeaderboardInstance.getTopUsers(),
                lastRefreshTime: mockLeaderboardInstance.lastRefreshTime,
            });
        });

        test("returns 500 when refresh fails", async () => {
            Leaderboard.findOne.mockRejectedValue(new Error("Save failed"));

            await leaderboardController.refreshLeaderboard({}, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Failed to refresh leaderboard." });
        });
    });
});