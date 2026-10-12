const testCaseRepository = require("../repository/TestCaseRepository");
const questionRepository = require("../repository/QuestionRepository");
const AppError = require("../utils/AppError");

const createTestCase = async (questionId, inputData, expectedOutput, userId, isHidden = false) => {

    const question = await questionRepository.GetQuestionById(questionId);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    return await testCaseRepository.CreateTestCase(
        questionId, inputData, expectedOutput, userId, isHidden ? 1 : 0
    );
};

/* Admin-only: the full set, expected outputs included. */
const getAllTestCases = async () => {
    return await testCaseRepository.GetAllTestCases();
};

/**
 * Role-aware read.
 *
 * Admins get every case so they can author and audit them. Everyone else gets
 * the sample cases only, and only for a question they are allowed to open —
 * a private contest question resolves only while its contest is live and the
 * caller is registered.
 */
const getTestCasesByQuestionId = async (questionId, user) => {

    const question = await questionRepository.GetQuestionById(questionId);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (user?.role === "ADMIN") {
        return await testCaseRepository.GetTestCasesByQuestionId(questionId);
    }

    if (question.is_contest_only) {
        const allowed = await questionRepository.IsLiveContestQuestionForUser(questionId, user.id);
        if (!allowed) {
            throw new AppError("This question is only available during its contest", 403);
        }
    }

    return await testCaseRepository.GetSampleTestCasesByQuestionId(questionId);
};

/* Admin-only: used by the test-case editor. */
const getTestCaseById = async (id) => {

    const testCase = await testCaseRepository.GetTestCaseById(id);
    if (!testCase) {
        throw new AppError("Test case not found", 404);
    }

    return testCase;
};

/* Authorship is not ownership: any admin may curate any test case. The route
   already restricts this to ADMIN. */
const updateTestCase = async (id, inputData, expectedOutput, isHidden) => {

    const testCase = await testCaseRepository.GetTestCaseById(id);
    if (!testCase) {
        throw new AppError("Test case not found", 404);
    }

    return await testCaseRepository.UpdateTestCase(
        id,
        inputData !== undefined ? inputData : testCase.input_data,
        expectedOutput !== undefined ? expectedOutput : testCase.expected_output,
        isHidden
    );
};

const deleteTestCase = async (id) => {

    const testCase = await testCaseRepository.GetTestCaseById(id);
    if (!testCase) {
        throw new AppError("Test case not found", 404);
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
