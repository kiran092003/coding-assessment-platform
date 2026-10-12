const pool = require("../db/connect");

const CreateQuestion = async (title, description, difficulty, returnType, params, createdBy, isContestOnly = 0) => {

    const query = `
        INSERT INTO questions (title, description, difficluty, return_type, params, created_by, is_contest_only)
        VALUES(?,?,?,?,?,?,?)
    `;

    const [result] = await pool.execute(query, [
        title, description, difficulty, returnType, params, createdBy, isContestOnly ? 1 : 0
    ]);

    return result;
};

/**
 * Practice pool listing. Contest questions live in a private pool and are
 * withheld from everyone but admins, so a contest problem cannot be
 * rehearsed (or have its sample cases read) before the contest opens.
 */
const GetAllQuestions = async (includeContestOnly = false) => {

    const query = includeContestOnly
        ? `SELECT * FROM questions ORDER BY created_at DESC`
        : `SELECT * FROM questions WHERE is_contest_only = 0 ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query);

    return rows;
};

const GetQuestionById = async (id) => {

    const query = `SELECT * FROM questions WHERE id = ?`;

    const [rows] = await pool.execute(query, [id]);

    return rows[0];
};

/**
 * True when the question belongs to a contest that is running right now AND
 * the user registered for it. This is what lets a contestant open a private
 * question during the window without exposing it at any other time.
 *
 * All services share one database, so this check is resolved locally rather
 * than through a cross-service call.
 */
const IsLiveContestQuestionForUser = async (questionId, userId) => {

    const query = `
        SELECT 1
          FROM contest_questions cq
          JOIN contests c             ON c.id = cq.contest_id
          JOIN contest_registrations r ON r.contest_id = c.id AND r.user_id = ?
         WHERE cq.question_id = ?
           AND NOW() BETWEEN c.start_time AND c.end_time
         LIMIT 1
    `;

    const [rows] = await pool.execute(query, [userId, questionId]);

    return rows.length > 0;
};

const UpdateQuestion = async (id, title, description, difficluty, returnType, params) => {

    const query = `
        UPDATE questions
        SET title = ?, description = ?, difficluty = ?, return_type = ?, params = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(query, [title, description, difficluty, returnType, params, id]);

    return result;
};

const DeleteQuestion = async (id) => {

    const query = `DELETE FROM questions WHERE id = ?`;

    const [result] = await pool.execute(query, [id]);

    return result;
};

module.exports = {
    CreateQuestion,
    GetAllQuestions,
    GetQuestionById,
    IsLiveContestQuestionForUser,
    UpdateQuestion,
    DeleteQuestion
};
