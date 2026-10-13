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

/**
 * Sample cases only, for the synchronous Run button.
 *
 * Submit scores against every case (hidden included); Run must never execute
 * a hidden case, because its pass/fail count would reveal information about
 * tests the solver is not meant to see.
 */
const getSampleTestCasesByQuestionId = async (questionId) => {
    const cacheKey = `testcases:sample:${questionId}`;

    const cachedData = await client.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const [rows] = await pool.execute(
        `SELECT * FROM test_cases WHERE question_id = ? AND is_hidden = 0 ORDER BY id ASC`,
        [questionId]
    );

    await client.set(cacheKey, JSON.stringify(rows), { EX: 3600 });

    return rows;
};

/**
 * Mirrors the submission eligibility rule for the Run button: practice
 * questions are always runnable, private contest questions only while the
 * contest is live and the caller is registered.
 */
const isQuestionRunnableByUser = async (questionId, userId, role) => {

    if (role === "ADMIN") return true;

    const [qRows] = await pool.execute(
        `SELECT is_contest_only FROM questions WHERE id = ?`,
        [questionId]
    );

    if (!qRows[0]) return false;
    if (!qRows[0].is_contest_only) return true;

    const [rows] = await pool.execute(
        `SELECT 1
           FROM contest_questions cq
           JOIN contests c              ON c.id = cq.contest_id
           JOIN contest_registrations r ON r.contest_id = c.id AND r.user_id = ?
          WHERE cq.question_id = ?
            AND NOW() BETWEEN c.start_time AND c.end_time
          LIMIT 1`,
        [userId, questionId]
    );

    return rows.length > 0;
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

    /* Clear every cache that now holds a stale snapshot of this submission.
       The single-submission key is not enough: the submission lists are cached
       too, and they were populated moments earlier while the status was still
       PENDING. Leaving them is what made a finished submission keep showing as
       pending on the question page until the TTL lapsed, while the My
       Submissions list — cached under a shorter TTL — already showed the
       verdict. */
    const [[row]] = await pool.execute(
        `SELECT user_id, question_id, contest_id FROM submissions WHERE id = ?`,
        [submissionId]
    );

    const staleKeys = await client.keys(`submission:${submissionId}:caller:*`);

    if (row) {
        staleKeys.push(
            `submissions:user:${row.user_id}:all`,
            `submissions:user:${row.user_id}:question:${row.question_id}`,
            `submissions:question:${row.question_id}`
        );
        if (row.contest_id) {
            staleKeys.push(
                `submissions:user:${row.user_id}:question:${row.question_id}:contest:${row.contest_id}`
            );
        }
    }

    if (staleKeys.length) await client.del(staleKeys);

    // Push status update to submission-service via Redis Pub/Sub
    await client.publish("submission:verdict", JSON.stringify(verdict));

    console.log(`  [Redis] Published verdict for submission ${submissionId}: ${status}`);
};

module.exports = {
    getTestCasesByQuestionId,
    getSampleTestCasesByQuestionId,
    isQuestionRunnableByUser,
    updateSubmissionStatus,
};
