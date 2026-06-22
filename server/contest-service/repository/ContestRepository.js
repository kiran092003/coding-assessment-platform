const pool = require("../db/connect");

// MySQL DATETIME requires "YYYY-MM-DD HH:MM:SS", not ISO 8601 with T/Z
const toMysql = (isoStr) => isoStr ? new Date(isoStr).toISOString().slice(0, 19).replace('T', ' ') : null

const CreateContest = async (title, description, startTime, endTime, createdBy) => {

    const query = `
        INSERT INTO contests (title, description, start_time, end_time, created_by)
        VALUES(?,?,?,?,?)
    `;

    const [result] = await pool.execute(query, [title, description, toMysql(startTime), toMysql(endTime), createdBy]);

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

    const [result] = await pool.execute(query, [title, description, toMysql(startTime), toMysql(endTime), id]);

    return result;
};

const DeleteContest = async (id) => {

    const query = `DELETE FROM contests WHERE id = ?`;

    const [result] = await pool.execute(query, [id]);

    return result;
};

const RegisterForContest = async (contestId, userId) => {
    await pool.execute(
        `INSERT IGNORE INTO contest_registrations (contest_id, user_id) VALUES (?, ?)`,
        [contestId, userId]
    );
};

const GetMyRegistration = async (contestId, userId) => {
    const [[{ total }]] = await pool.execute(
        `SELECT COUNT(*) AS total FROM contest_registrations WHERE contest_id = ?`,
        [contestId]
    );
    const [rows] = await pool.execute(
        `SELECT id FROM contest_registrations WHERE contest_id = ? AND user_id = ?`,
        [contestId, userId]
    );
    return { registered: rows.length > 0, registrationCount: total };
};

module.exports = {
    CreateContest,
    GetAllContests,
    GetContestById,
    UpdateContest,
    DeleteContest,
    RegisterForContest,
    GetMyRegistration,
};
