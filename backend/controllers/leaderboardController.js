const Leaderboard = require("../models/Leaderboard");
const ProgressTracker = require("../models/ProgressTracker");
const User = require("../models/User");

// GET /api/leaderboard
// Returns the current ranked leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Leaderboard.findOne();

        if (!leaderboard || leaderboard.userRankings.length === 0) {
            return res.status(200).json({ message: "No leaderboard data available.", rankings: [] });
        }

        return res.status(200).json({
            rankings: leaderboard.getTopUsers(),
            lastRefreshTime: leaderboard.lastRefreshTime,
        });
    } catch (err) {
        return res.status(500).json({ error: "Failed to fetch leaderboard." });
    }
};

// POST /api/leaderboard/refresh
// Aggregates all ProgressTrackers and recalculates rankings
exports.refreshLeaderboard = async (req, res) => {
    try {
        const trackers = await ProgressTracker.find().populate("userID", "username");

        let leaderboard = await Leaderboard.findOne();
        if (!leaderboard) {
            leaderboard = new Leaderboard({ userRankings: [] });
        }

        for (const tracker of trackers) {
            if (!tracker.userID) continue; // skip if user was deleted
            leaderboard.updateUserScore(
                tracker.userID._id,
                tracker.userID.username,
                tracker.overallcompletion
            );
        }

        await leaderboard.recalculateRankings(); // sorts + saves

        return res.status(200).json({
            message: "Leaderboard refreshed.",
            rankings: leaderboard.getTopUsers(),
            lastRefreshTime: leaderboard.lastRefreshTime,
        });
    } catch (err) {
        return res.status(500).json({ error: "Failed to refresh leaderboard." });
    }
};