const submissionRepository = require("../repository/SubmissionRepository");
const AppError = require("../utils/AppError");
const { publishSubmission } = require("../producer/RabbitMQProducer");

const VALID_LANGUAGES = ["C", "CPP", "JAVA", "PYTHON", "JAVASCRIPT"];

const createSubmission = async (userId, questionId, language, sourceCode, contestId) => {

    if (!VALID_LANGUAGES.includes(language.toUpperCase())) {
        throw new AppError(`Invalid language. Allowed: ${VALID_LANGUAGES.join(", ")}`, 400);
    }

    const result = await submissionRepository.CreateSubmission(
        userId, questionId,
        language.toUpperCase(), sourceCode,
        "PENDING",
        null,
        null,
        null,
        contestId || null
    );

    await publishSubmission({
        submissionId: result.insertId,
        userId,
        questionId,
        language,
        sourceCode,
        contestId: contestId || null
    });

    return result;
};

const getSubmissionById = async (id, userId) => {

    const submission = await submissionRepository.GetSubmissionById(id);

    if (!submission) {
        throw new AppError("Submission not found", 404);
    }

    if (submission.user_id !== userId) {
        throw new AppError("You are not authorized to view this submission", 403);
    }

    return submission;
};

const getSubmissionsByUserAndQuestion = async (userId, questionId) => {
    return await submissionRepository.GetSubmissionsByUserAndQuestion(userId, questionId);
};

const getSubmissionsByQuestion = async (questionId) => {
    return await submissionRepository.GetSubmissionsByQuestion(questionId);
};

const deleteSubmission = async (id, userId) => {

    const submission = await submissionRepository.GetSubmissionById(id);

    if (!submission) {
        throw new AppError("Submission not found", 404);
    }

    if (submission.user_id !== userId) {
        throw new AppError("You are not authorized to delete this submission", 403);
    }

    return await submissionRepository.DeleteSubmission(id);
};

module.exports = {
    createSubmission,
    getSubmissionById,
    getSubmissionsByUserAndQuestion,
    getSubmissionsByQuestion,
    deleteSubmission
};
