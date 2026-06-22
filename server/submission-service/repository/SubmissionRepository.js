const pool = require("../db/connect");

const CreateSubmission = async (userId, questionId, language, sourceCode, status, totalTestcases, passedTestcases, executionTimeMs, contestId) => {

    const query = `
        INSERT INTO submissions
        (user_id, question_id, language, source_code, status, total_testcases, passed_testcases, execution_time_ms, contest_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
        userId, questionId, language, sourceCode, status,
        totalTestcases, passedTestcases, executionTimeMs,
        contestId || null
    ]);

    return result;
};

const GetSubmissionById = async (id) => {

    const query = `SELECT * FROM submissions WHERE id = ?`;

    const [rows] = await pool.execute(query, [id]);

    return rows[0];
};

const GetSubmissionsByUserAndQuestion = async (userId, questionId, contestId = null) => {

    let query, params;

    if (contestId) {
        query = `SELECT * FROM submissions WHERE user_id = ? AND question_id = ? AND contest_id = ? ORDER BY submitted_at DESC`;
        params = [userId, questionId, contestId];
    } else {
        query = `SELECT * FROM submissions WHERE user_id = ? AND question_id = ? AND contest_id IS NULL ORDER BY submitted_at DESC`;
        params = [userId, questionId];
    }

    const [rows] = await pool.execute(query, params);

    return rows;
};

const GetSubmissionsByQuestion = async (questionId) => {

    const query = `
        SELECT * FROM submissions
        WHERE question_id = ?
        ORDER BY submitted_at DESC
    `;

    const [rows] = await pool.execute(query, [questionId]);

    return rows;
};

const DeleteSubmission = async (id) => {

    const query = `DELETE FROM submissions WHERE id = ?`;

    const [result] = await pool.execute(query, [id]);

    return result;
};

const UpdateSubmissionStatus = async (
    submissionId,
    status,
    passedTestcases,
    totalTestcases,
    executionTimeMs
) => {

    const query = `
        UPDATE submissions
        SET status = ?,
            passed_testcases = ?,
            total_testcases = ?,
            execution_time_ms = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
        status,
        passedTestcases,
        totalTestcases,
        executionTimeMs,
        submissionId
    ]);

    return result;
};

const GetAllSubmissionsByUser = async (userId) => {
    const query = `
        SELECT s.id, s.question_id, s.language, s.status,
               s.total_testcases, s.passed_testcases, s.execution_time_ms,
               s.submitted_at, s.contest_id,
               q.title AS question_title
        FROM submissions s
        LEFT JOIN questions q ON s.question_id = q.id
        WHERE s.user_id = ?
        ORDER BY s.submitted_at DESC
        LIMIT 100
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
};

module.exports = {
    CreateSubmission,
    GetSubmissionById,
    GetSubmissionsByUserAndQuestion,
    GetSubmissionsByQuestion,
    DeleteSubmission,
    UpdateSubmissionStatus,
    GetAllSubmissionsByUser
};
