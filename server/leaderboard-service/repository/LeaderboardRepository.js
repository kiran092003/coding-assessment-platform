const pool = require("../db/connect");
const { client } = require("../config/redis");

const REDIS_KEY = (contestId) => `leaderboard:contest:${contestId}`;

// Get the current best score record for a user's question attempt in a contest
const getBestScore = async (contestId, userId, questionId) => {
    const [rows] = await pool.execute(
        `SELECT best_score, best_passed_testcases
         FROM contest_question_status
         WHERE contest_id = ? AND user_id = ? AND question_id = ?`,
        [contestId, userId, questionId]
    );
    return rows[0] || null;
};

// INSERT first attempt, UPDATE only when new score beats the current best
const upsertQuestionStatus = async (contestId, userId, questionId, bestScore, bestPassed) => {
    await pool.execute(
        `INSERT INTO contest_question_status
             (contest_id, user_id, question_id, best_score, best_passed_testcases)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
             best_score             = VALUES(best_score),
             best_passed_testcases  = VALUES(best_passed_testcases)`,
        [contestId, userId, questionId, bestScore, bestPassed]
    );
};

// Fetch question points (defaults to 100 if not set)
const getPointsForQuestion = async (contestId, questionId) => {
    try {
        const [rows] = await pool.execute(
            `SELECT points FROM contest_questions WHERE contest_id = ? AND question_id = ?`,
            [contestId, questionId]
        );
        return rows[0]?.points ?? 100;
    } catch {
        return 100;
    }
};

// Add scoreDelta to the user's leaderboard row.
// isFirstScore = true → also increments solved_count (first time any points for this question)
const upsertLeaderboard = async (contestId, userId, scoreDelta, isFirstScore) => {
    await pool.execute(
        `INSERT INTO leaderboard (contest_id, user_id, score, solved_count, penalty, updated_at)
         VALUES (?, ?, ?, ?, 0, NOW())
         ON DUPLICATE KEY UPDATE
             score        = score + VALUES(score),
             solved_count = solved_count + VALUES(solved_count),
             updated_at   = NOW()`,
        [contestId, userId, scoreDelta, isFirstScore ? 1 : 0]
    );
};

// Add scoreDelta to the Redis sorted set
const incrementRedisScore = async (contestId, userId, scoreDelta) => {
    await client.zIncrBy(REDIS_KEY(contestId), scoreDelta, `user:${userId}`);
};

// Get top-N rankings from Redis, enriched with user names from DB
const getLeaderboard = async (contestId, topN = 50) => {
    const entries = await client.zRangeWithScores(REDIS_KEY(contestId), 0, topN - 1, { REV: true });

    if (!entries.length) {
        // Fallback: build from DB if Redis is cold
        const [rows] = await pool.execute(
            `SELECT l.user_id, l.score, l.solved_count, u.name
             FROM leaderboard l
             JOIN users u ON l.user_id = u.id
             WHERE l.contest_id = ?
             ORDER BY l.score DESC, l.updated_at ASC
             LIMIT ?`,
            [contestId, topN]
        );
        return rows.map((r, i) => ({
            rank: i + 1,
            userId: r.user_id,
            name: r.name,
            score: r.score,
            solvedCount: r.solved_count
        }));
    }

    // Enrich Redis entries with user names + solved_count from DB
    const userIds = entries.map(e => parseInt(e.value.replace("user:", "")));
    const placeholders = userIds.map(() => "?").join(",");
    const [users] = await pool.execute(
        `SELECT id, name FROM users WHERE id IN (${placeholders})`,
        userIds
    );
    const [lbRows] = await pool.execute(
        `SELECT user_id, solved_count FROM leaderboard WHERE contest_id = ? AND user_id IN (${placeholders})`,
        [contestId, ...userIds]
    );
    const nameMap   = Object.fromEntries(users.map(u => [u.id, u.name]));
    const solvedMap = Object.fromEntries(lbRows.map(r => [r.user_id, r.solved_count]));

    return entries.map((e, i) => {
        const uid = parseInt(e.value.replace("user:", ""));
        return {
            rank: i + 1,
            userId: uid,
            name: nameMap[uid] || "Unknown",
            score: e.score,
            solvedCount: solvedMap[uid] || 0,
        };
    });
};

// Record that a user has started/ended a contest
const upsertParticipant = async (contestId, userId, ended = false) => {
    if (ended) {
        await pool.execute(
            `INSERT INTO contest_participants (contest_id, user_id, ended_at)
             VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE ended_at = NOW()`,
            [contestId, userId]
        );
    } else {
        await pool.execute(
            `INSERT IGNORE INTO contest_participants (contest_id, user_id)
             VALUES (?, ?)`,
            [contestId, userId]
        );
    }
};

// Get the current user's leaderboard entry plus total question count for the contest
const getUserEntry = async (contestId, userId) => {
    const [[{ total }]] = await pool.execute(
        `SELECT COUNT(*) AS total FROM contest_questions WHERE contest_id = ?`,
        [contestId]
    );
    const [rows] = await pool.execute(
        `SELECT score, solved_count FROM leaderboard WHERE contest_id = ? AND user_id = ?`,
        [contestId, userId]
    );
    const [pRows] = await pool.execute(
        `SELECT ended_at FROM contest_participants WHERE contest_id = ? AND user_id = ?`,
        [contestId, userId]
    );
    const hasEnded = !!(pRows[0]?.ended_at);
    if (!rows[0]) {
        return { score: 0, solvedCount: 0, totalQuestions: total, participated: hasEnded, hasEnded };
    }
    return {
        score: rows[0].score,
        solvedCount: rows[0].solved_count,
        totalQuestions: total,
        participated: true,
        hasEnded,
    };
};

// Warm Redis sorted set from DB (called on service startup if needed)
const warmRedisFromDB = async (contestId) => {
    const [rows] = await pool.execute(
        `SELECT user_id, score FROM leaderboard WHERE contest_id = ?`,
        [contestId]
    );
    if (!rows.length) return;
    const members = rows.map(r => ({ score: r.score, value: `user:${r.user_id}` }));
    await client.zAdd(REDIS_KEY(contestId), members);
};

module.exports = {
    getBestScore,
    upsertQuestionStatus,
    getPointsForQuestion,
    upsertLeaderboard,
    incrementRedisScore,
    getLeaderboard,
    getUserEntry,
    upsertParticipant,
    warmRedisFromDB,
};
