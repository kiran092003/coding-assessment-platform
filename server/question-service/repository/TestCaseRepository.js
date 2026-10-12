const pool = require("../db/connect");

const CreateTestCase = async (questionId, inputData, expectedOutput, createdBy, isHidden = 0) => {

    const query = `
        INSERT INTO test_cases (question_id, input_data, expected_output, created_by, is_hidden)
        VALUES(?,?,?,?,?)
    `;

    const [result] = await pool.execute(query, [
        questionId, inputData, expectedOutput, createdBy, isHidden ? 1 : 0
    ]);

    return result;
};

const GetAllTestCases = async () => {

    const query = `SELECT * FROM test_cases ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query);

    return rows;
};

const GetTestCasesByQuestionId = async (questionId) => {

    const query = `SELECT * FROM test_cases WHERE question_id = ? ORDER BY id ASC`;

    const [rows] = await pool.execute(query, [questionId]);

    return rows;
};

/**
 * Sample cases only — the worked examples a solver is meant to see.
 * Hidden cases decide the verdict and never leave the server, so they are
 * excluded here rather than filtered in the caller.
 */
const GetSampleTestCasesByQuestionId = async (questionId) => {

    const query = `
        SELECT id, question_id, input_data, expected_output, is_hidden, created_at
          FROM test_cases
         WHERE question_id = ? AND is_hidden = 0
         ORDER BY id ASC
    `;

    const [rows] = await pool.execute(query, [questionId]);

    return rows;
};

const GetTestCaseById = async (id) => {

    const query = `SELECT * FROM test_cases WHERE id = ?`;

    const [rows] = await pool.execute(query, [id]);

    return rows[0];
};

const UpdateTestCase = async (id, inputData, expectedOutput, isHidden) => {

    if (isHidden === undefined || isHidden === null) {
        const query = `UPDATE test_cases SET input_data = ?, expected_output = ? WHERE id = ?`;
        const [result] = await pool.execute(query, [inputData, expectedOutput, id]);
        return result;
    }

    const query = `UPDATE test_cases SET input_data = ?, expected_output = ?, is_hidden = ? WHERE id = ?`;
    const [result] = await pool.execute(query, [inputData, expectedOutput, isHidden ? 1 : 0, id]);
    return result;
};

const DeleteTestCase = async (id) => {

    const query = `DELETE FROM test_cases WHERE id = ?`;

    const [result] = await pool.execute(query, [id]);

    return result;
};

module.exports = {
    CreateTestCase,
    GetAllTestCases,
    GetTestCasesByQuestionId,
    GetSampleTestCasesByQuestionId,
    GetTestCaseById,
    UpdateTestCase,
    DeleteTestCase
};
