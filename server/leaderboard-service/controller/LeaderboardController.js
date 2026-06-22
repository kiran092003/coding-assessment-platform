const leaderboardService = require("../services/LeaderboardService");

const GetLeaderboard = async (req, res) => {
    try {
        const { contestId } = req.params;
        const topN = parseInt(req.query.top) || 50;

        const leaderboard = await leaderboardService.getLeaderboard(contestId, topN);

        res.status(200).json({ contestId: parseInt(contestId), leaderboard });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetMyEntry = async (req, res) => {
    try {
        const { contestId } = req.params;
        const userId = req.user.id;

        const entry = await leaderboardService.getMyEntry(contestId, userId);
        res.status(200).json(entry);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const RecordStart = async (req, res) => {
    try {
        const { contestId } = req.params;
        await leaderboardService.recordParticipation(contestId, req.user.id, false);
        res.status(200).json({ ok: true });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const RecordEnd = async (req, res) => {
    try {
        const { contestId } = req.params;
        await leaderboardService.recordParticipation(contestId, req.user.id, true);
        res.status(200).json({ ok: true });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = { GetLeaderboard, GetMyEntry, RecordStart, RecordEnd };
