const pool = require("../db/connect");

const GetQuestionCountByContest = async (contestId) => {

    const query = `SELECT COUNT(*) AS count FROM contest_questions WHERE contest_id = ?`;

    const [rows] = await pool.execute(query, [contestId]);

    return rows[0].count;
};

const GetMapping = async (contestId, questionId) => {

    const query = `SELECT * FROM contest_questions WHERE contest_id = ? AND question_id = ?`;

    const [rows] = await pool.execute(query, [contestId, questionId]);

    return rows[0];
};

const AddQuestionToContest = async (contestId, questionId, points) => {

    const query = `INSERT INTO contest_questions (contest_id, question_id, points) VALUES (?, ?, ?)`;

    const [result] = await pool.execute(query, [contestId, questionId, points ?? null]);

    return result;
};

const UpdatePoints = async (contestId, questionId, points) => {

    const query = `UPDATE contest_questions SET points = ? WHERE contest_id = ? AND question_id = ?`;

    const [result] = await pool.execute(query, [points ?? null, contestId, questionId]);

    return result;
};

const GetQuestionsByContest = async (contestId) => {

    const query = `
        SELECT q.*, cq.points
        FROM contest_questions cq
        JOIN questions q ON cq.question_id = q.id
        WHERE cq.contest_id = ?
    `;

    const [rows] = await pool.execute(query, [contestId]);

    return rows;
};

/* Window + registration state for one caller, resolved in a single round trip. */
const GetContestAccess = async (contestId, userId) => {

    const query = `
        SELECT c.id,
               c.start_time,
               c.end_time,
               NOW() < c.start_time                     AS not_started,
               NOW() BETWEEN c.start_time AND c.end_time AS is_live,
               NOW() > c.end_time                       AS has_ended,
               EXISTS (
                   SELECT 1 FROM contest_registrations r
                    WHERE r.contest_id = c.id AND r.user_id = ?
               ) AS is_registered
          FROM contests c
         WHERE c.id = ?
    `;

    const [rows] = await pool.execute(query, [userId, contestId]);

    return rows[0];
};

/* Used when mapping: a contest question must come from the private pool. */
const GetQuestionPoolFlag = async (questionId) => {

    const query = `SELECT id, is_contest_only FROM questions WHERE id = ?`;

    const [rows] = await pool.execute(query, [questionId]);

    return rows[0];
};

const RemoveQuestionFromContest = async (contestId, questionId) => {

    const query = `DELETE FROM contest_questions WHERE contest_id = ? AND question_id = ?`;

    const [result] = await pool.execute(query, [contestId, questionId]);

    return result;
};

module.exports = {
    GetQuestionCountByContest,
    GetContestAccess,
    GetQuestionPoolFlag,
    GetMapping,
    AddQuestionToContest,
    UpdatePoints,
    GetQuestionsByContest,
    RemoveQuestionFromContest
};
