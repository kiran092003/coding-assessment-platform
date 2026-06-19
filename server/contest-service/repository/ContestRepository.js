const pool = require("../db/connect");

const CreateContest = async (title, description, startTime, endTime, createdBy) => {

    const query = `
        INSERT INTO contests (title, description, start_time, end_time, created_by)
        VALUES(?,?,?,?,?)
    `;

    const [result] = await pool.execute(query, [title, description, startTime, endTime, createdBy]);

    return result;
};

const GetAllContests = async () => {

    const query = `SELECT * FROM contests ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query);

    return rows;
};

const GetContestById = async (id) => {

    const query = `SELECT * FROM contests WHERE id = ?`;

    const [rows] = await pool.execute(query, [id]);

    return rows[0];
};

const UpdateContest = async (id, title, description, startTime, endTime) => {

    const query = `
        UPDATE contests
        SET title = ?, description = ?, start_time = ?, end_time = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(query, [title, description, startTime, endTime, id]);

    return result;
};

const DeleteContest = async (id) => {

    const query = `DELETE FROM contests WHERE id = ?`;

    const [result] = await pool.execute(query, [id]);

    return result;
};

module.exports = {
    CreateContest,
    GetAllContests,
    GetContestById,
    UpdateContest,
    DeleteContest
};
