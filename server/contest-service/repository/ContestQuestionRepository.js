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

const RemoveQuestionFromContest = async (contestId, questionId) => {

    const query = `DELETE FROM contest_questions WHERE contest_id = ? AND question_id = ?`;

    const [result] = await pool.execute(query, [contestId, questionId]);

    return result;
};

module.exports = {
    GetQuestionCountByContest,
    GetMapping,
    AddQuestionToContest,
    UpdatePoints,
    GetQuestionsByContest,
    RemoveQuestionFromContest
};
