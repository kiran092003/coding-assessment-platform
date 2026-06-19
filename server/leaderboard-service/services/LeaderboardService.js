const leaderboardRepository = require("../repository/LeaderboardRepository");
const { getIO } = require("../socket/socket");
const { createLogger } = require("../../shared/logger/logger");
const { increment } = require("../metrics");

const logger = createLogger("leaderboard-service");

const handleScoredSubmission = async ({ contestId, userId, questionId, passedTestCases, totalTestCases }) => {
    if (!contestId) return;
    if (!passedTestCases || passedTestCases === 0) return;

    const questionPoints = await leaderboardRepository.getPointsForQuestion(contestId, questionId);
    const newScore = Math.floor((questionPoints * passedTestCases) / totalTestCases);

    const current = await leaderboardRepository.getBestScore(contestId, userId, questionId);
    const currentBest = current?.best_score ?? 0;

    if (newScore <= currentBest) {
        logger.info("Score not improved, skipping", { userId, contestId, questionId, newScore, currentBest });
        return;
    }

    const delta = newScore - currentBest;
    const isFirstScore = currentBest === 0;

    await leaderboardRepository.upsertQuestionStatus(contestId, userId, questionId, newScore, passedTestCases);
    await leaderboardRepository.upsertLeaderboard(contestId, userId, delta, isFirstScore);
    await leaderboardRepository.incrementRedisScore(contestId, userId, delta);
    increment("scoresProcessed");

    logger.info("Leaderboard updated", {
        userId,
        contestId,
        questionId,
        passed: `${passedTestCases}/${totalTestCases}`,
        score: `${currentBest}→${newScore}`,
        delta,
    });

    // Push updated leaderboard to all clients watching this contest
    const io = getIO();
    if (io) {
        const updated = await leaderboardRepository.getLeaderboard(contestId, 50);
        io.to(`leaderboard:${contestId}`).emit("leaderboardUpdate", updated);
    }
};

const getLeaderboard = async (contestId, topN) => {
    return await leaderboardRepository.getLeaderboard(contestId, topN);
};

module.exports = { handleScoredSubmission, getLeaderboard };
