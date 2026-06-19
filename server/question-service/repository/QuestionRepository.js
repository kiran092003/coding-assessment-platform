const pool = require("../db/connect");

const CreateQuestion = async (title, description, difficulty, createdBy) => {

    const query = `
        INSERT INTO questions (title, description, difficluty, created_by)
        VALUES(?,?,?,?)
    `;

    const [result] = await pool.execute(query, [title, description, difficulty, createdBy]);

    return result;
};

const GetAllQuestions = async () => {

    const query = `SELECT * FROM questions ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query);

    return rows;
};

const GetQuestionById = async (id) => {

    const query = `SELECT * FROM questions WHERE id = ?`;

    const [rows] = await pool.execute(query, [id]);

    return rows[0];
};

const UpdateQuestion = async (id, title, description, difficluty) => {

    const query = `
        UPDATE questions
        SET title = ?, description = ?, difficluty = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(query, [title, description, difficluty, id]);

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
    UpdateQuestion,
    DeleteQuestion
};
