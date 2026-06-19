const testCaseRepository = require("../repository/TestCaseRepository");
const questionRepository = require("../repository/QuestionRepository");
const AppError = require("../utils/AppError");

const createTestCase = async (questionId, inputData, expectedOutput, userId) => {

    const question = await questionRepository.GetQuestionById(questionId);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    return await testCaseRepository.CreateTestCase(questionId, inputData, expectedOutput, userId);
};

const getAllTestCases = async () => {
    return await testCaseRepository.GetAllTestCases();
};

const getTestCasesByQuestionId = async (questionId) => {

    const question = await questionRepository.GetQuestionById(questionId);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    return await testCaseRepository.GetTestCasesByQuestionId(questionId);
};

const getTestCaseById = async (id) => {

    const testCase = await testCaseRepository.GetTestCaseById(id);
    if (!testCase) {
        throw new AppError("Test case not found", 404);
    }

    return testCase;
};

const updateTestCase = async (id, inputData, expectedOutput, userId) => {

    const testCase = await testCaseRepository.GetTestCaseById(id);
    if (!testCase) {
        throw new AppError("Test case not found", 404);
    }

    if (testCase.created_by !== userId) {
        throw new AppError("You are not authorized to update this test case", 403);
    }

    return await testCaseRepository.UpdateTestCase(id, inputData, expectedOutput);
};

const deleteTestCase = async (id, userId) => {

    const testCase = await testCaseRepository.GetTestCaseById(id);
    if (!testCase) {
        throw new AppError("Test case not found", 404);
    }

    if (testCase.created_by !== userId) {
        throw new AppError("You are not authorized to delete this test case", 403);
    }

    return await testCaseRepository.DeleteTestCase(id);
};

module.exports = {
    createTestCase,
    getAllTestCases,
    getTestCasesByQuestionId,
    getTestCaseById,
    updateTestCase,
    deleteTestCase
};
