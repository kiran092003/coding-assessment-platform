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

module.exports = { GetLeaderboard };
