const pool = require("../db/connect");
const { client } = require("../config/redis");

const getTestCasesByQuestionId = async (questionId) => {
    const cacheKey = `testcases:question:${questionId}`;

    const cachedData = await client.get(cacheKey);

    if (cachedData) {
        console.log(`  [Redis] test cases for question ${questionId} served from cache`);
        return JSON.parse(cachedData);
    }

    const [rows] = await pool.execute(
        `SELECT * FROM test_cases WHERE question_id = ? ORDER BY id ASC`,
        [questionId]
    );

    await client.set(cacheKey, JSON.stringify(rows), { EX: 3600 });

    return rows;
};

const updateSubmissionStatus = async (
    submissionId,
    status,
    passedTestcases,
    totalTestcases,
    executionTimeMs
) => {
    await pool.execute(
        `UPDATE submissions
         SET status = ?, passed_testcases = ?, total_testcases = ?, execution_time_ms = ?
         WHERE id = ?`,
        [status, passedTestcases, totalTestcases, executionTimeMs, submissionId]
    );

    const verdict = { submissionId, status, passedTestcases, totalTestcases, executionTimeMs };

    // Invalidate submission cache so the next REST poll returns fresh data
    await client.del(`submission:${submissionId}`);

    // Push status update to submission-service via Redis Pub/Sub
    await client.publish("submission:verdict", JSON.stringify(verdict));

    console.log(`  [Redis] Published verdict for submission ${submissionId}: ${status}`);
};

module.exports = { getTestCasesByQuestionId, updateSubmissionStatus };
