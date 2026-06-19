const contestQuestionRepository = require("../repository/ContestQuestionRepository");
const AppError = require("../utils/AppError");

const MAX_QUESTIONS_PER_CONTEST = 3;

const addQuestionToContest = async (contestId, questionId, points) => {

    const count = await contestQuestionRepository.GetQuestionCountByContest(contestId);

    if (count >= MAX_QUESTIONS_PER_CONTEST) {
        throw new AppError("A contest can have at most 3 questions", 400);
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

const getQuestionsByContest = async (contestId) => {
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
    addQuestionToContest,
    updateQuestionPoints,
    getQuestionsByContest,
    removeQuestionFromContest
};
