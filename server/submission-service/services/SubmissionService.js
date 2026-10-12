const submissionRepository = require("../repository/SubmissionRepository");
const eligibilityRepository = require("../repository/EligibilityRepository");
const AppError = require("../utils/AppError");
const { publishSubmission } = require("../producer/RabbitMQProducer");

const VALID_LANGUAGES = ["C", "CPP", "JAVA", "PYTHON", "JAVASCRIPT"];
const MAX_SOURCE_BYTES = 64 * 1024;

/**
 * A submission is the only action that produces score, so every claim the
 * client makes about it is re-derived from the database here.
 *
 * Without this, `contestId` was taken at face value: you could submit to a
 * contest you never registered for, to a question that wasn't on its paper,
 * or hours after it closed, and still be scored.
 */
const assertSubmissionAllowed = async (userId, questionId, contestId) => {

    const question = await eligibilityRepository.GetQuestionPoolFlag(questionId);

    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (!contestId) {
        // Practice submission. Private contest questions are not practisable.
        if (question.is_contest_only) {
            throw new AppError("This question can only be solved inside its contest", 403);
        }
        return;
    }

    const access = await eligibilityRepository.GetContestEligibility(contestId, questionId, userId);

    if (!access) {
        throw new AppError("Contest not found", 404);
    }

    if (Number(access.question_in_contest) === 0) {
        throw new AppError("This question is not part of the contest", 400);
    }

    if (Number(access.is_registered) === 0) {
        throw new AppError("You must register for this contest before submitting", 403);
    }

    if (Number(access.not_started) === 1) {
        throw new AppError("The contest has not started yet", 403);
    }

    if (Number(access.has_ended) === 1) {
        throw new AppError("The contest has ended. Submissions are closed.", 403);
    }
};

const createSubmission = async (userId, questionId, language, sourceCode, contestId) => {

    if (!VALID_LANGUAGES.includes((language || "").toUpperCase())) {
        throw new AppError(`Invalid language. Allowed: ${VALID_LANGUAGES.join(", ")}`, 400);
    }

    if (!sourceCode || !sourceCode.trim()) {
        throw new AppError("Source code is required", 400);
    }

    if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_BYTES) {
        throw new AppError("Source code exceeds the 64 KB limit", 413);
    }

    await assertSubmissionAllowed(userId, questionId, contestId || null);

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

const getSubmissionById = async (id, userId, role) => {

    const submission = await submissionRepository.GetSubmissionById(id);

    if (!submission) {
        throw new AppError("Submission not found", 404);
    }

    if (role !== "ADMIN" && submission.user_id !== userId) {
        throw new AppError("You are not authorized to view this submission", 403);
    }

    return submission;
};

const getSubmissionsByUserAndQuestion = async (userId, questionId, contestId = null) => {
    return await submissionRepository.GetSubmissionsByUserAndQuestion(userId, questionId, contestId);
};

const getSubmissionsByQuestion = async (questionId) => {
    return await submissionRepository.GetSubmissionsByQuestion(questionId);
};

const deleteSubmission = async (id, userId, role) => {

    const submission = await submissionRepository.GetSubmissionById(id);

    if (!submission) {
        throw new AppError("Submission not found", 404);
    }

    /* The route is ADMIN-only, but the previous owner check compared against
       the caller's own id, so an admin could never delete anyone else's
       submission — the endpoint was unusable for moderation. */
    if (role !== "ADMIN" && submission.user_id !== userId) {
        throw new AppError("You are not authorized to delete this submission", 403);
    }

    return await submissionRepository.DeleteSubmission(id);
};

const getAllSubmissionsByUser = async (userId) => {
    return await submissionRepository.GetAllSubmissionsByUser(userId);
};

module.exports = {
    assertSubmissionAllowed,
    createSubmission,
    getSubmissionById,
    getSubmissionsByUserAndQuestion,
    getSubmissionsByQuestion,
    deleteSubmission,
    getAllSubmissionsByUser
};
