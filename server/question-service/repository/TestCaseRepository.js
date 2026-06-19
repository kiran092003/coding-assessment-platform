const pool = require("../db/connect");

const CreateTestCase = async (questionId, inputData, expectedOutput, createdBy) => {

    const query = `
        INSERT INTO test_cases (question_id, input_data, expected_output, created_by)
        VALUES(?,?,?,?)
    `;

    const [result] = await pool.execute(query, [questionId, inputData, expectedOutput, createdBy]);

    return result;
};

const GetAllTestCases = async () => {

    const query = `SELECT * FROM test_cases ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query);

    return rows;
};

const GetTestCasesByQuestionId = async (questionId) => {

    const query = `SELECT * FROM test_cases WHERE question_id = ? ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query, [questionId]);

    return rows;
};

const GetTestCaseById = async (id) => {

    const query = `SELECT * FROM test_cases WHERE id = ?`;

    const [rows] = await pool.execute(query, [id]);

    return rows[0];
};

const UpdateTestCase = async (id, inputData, expectedOutput) => {

    const query = `
        UPDATE test_cases
        SET input_data = ?, expected_output = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(query, [inputData, expectedOutput, id]);

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
    GetTestCaseById,
    UpdateTestCase,
    DeleteTestCase
};
