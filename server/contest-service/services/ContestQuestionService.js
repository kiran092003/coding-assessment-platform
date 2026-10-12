const contestQuestionRepository = require("../repository/ContestQuestionRepository");
const AppError = require("../utils/AppError");

const MAX_QUESTIONS_PER_CONTEST = 4;

const addQuestionToContest = async (contestId, questionId, points) => {

    const count = await contestQuestionRepository.GetQuestionCountByContest(contestId);

    if (count >= MAX_QUESTIONS_PER_CONTEST) {
        throw new AppError(`A contest can have at most ${MAX_QUESTIONS_PER_CONTEST} questions`, 400);
    }

    /* Contest problems must come from the private pool. Mapping a practice
       question would let anyone rehearse it — and read its sample cases —
       before the contest opens. */
    const question = await contestQuestionRepository.GetQuestionPoolFlag(questionId);

    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (!question.is_contest_only) {
        throw new AppError(
            "Only contest-only questions can be mapped to a contest. This question is in the public practice pool.",
            400
        );
    }

    const existing = await contestQuestionRepository.GetMapping(contestId, questionId);

    if (existing) {
        throw new AppError("This question is already mapped to the contest", 409);
    }

    return await contestQuestionRepository.AddQuestionToContest(contestId, questionId, points ?? null);
};

const updateQuestionPoints = async (contestId, questionId, points) => {

    const existing = await contestQuestionRepository.GetMapping(contestId, questionId);

    if (!existing) {
        throw new AppError("Mapping not found", 404);
    }

    return await contestQuestionRepository.UpdatePoints(contestId, questionId, points ?? null);
};

/**
 * The contest paper. Admins can always see it; a contestant can only see it
 * once the contest has opened, and only if they registered.
 *
 * Returning the paper early is the most valuable thing a cheater can get —
 * it buys unlimited offline preparation time — so this is gated on the
 * server rather than hidden in the UI.
 */
const getQuestionsByContest = async (contestId, user) => {

    if (user?.role === "ADMIN") {
        return await contestQuestionRepository.GetQuestionsByContest(contestId);
    }

    const access = await contestQuestionRepository.GetContestAccess(contestId, user.id);

    if (!access) {
        throw new AppError("Contest not found", 404);
    }

    if (Number(access.not_started) === 1) {
        throw new AppError("The contest has not started yet. Questions unlock at the start time.", 403);
    }

    if (Number(access.is_registered) === 0) {
        throw new AppError("You must register for this contest to view its questions", 403);
    }

    return await contestQuestionRepository.GetQuestionsByContest(contestId);
};

const removeQuestionFromContest = async (contestId, questionId) => {

    const existing = await contestQuestionRepository.GetMapping(contestId, questionId);

    if (!existing) {
        throw new AppError("Mapping not found", 404);
    }

    return await contestQuestionRepository.RemoveQuestionFromContest(contestId, questionId);
};

module.exports = {
    MAX_QUESTIONS_PER_CONTEST,
    addQuestionToContest,
    updateQuestionPoints,
    getQuestionsByContest,
    removeQuestionFromContest
};
