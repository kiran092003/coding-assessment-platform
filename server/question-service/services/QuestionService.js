const questionRepository = require("../repository/QuestionRepository");
const AppError = require("../utils/AppError");

const VALID_DIFFICULTIES = ["Low", "Medium", "High"];
const VALID_RETURN_TYPES = ["int", "long long", "double", "bool", "string", "vector<int>", "vector<string>", "vector<vector<int>>", "void"];

const createQuestion = async (title, description, difficulty, returnType, params, userId, isContestOnly = false) => {

    if (!VALID_DIFFICULTIES.includes(difficulty)) {
        throw new AppError("Invalid difficulty. Must be Low, Medium, or High", 400);
    }

    if (!VALID_RETURN_TYPES.includes(returnType)) {
        throw new AppError(`Invalid return type. Must be one of: ${VALID_RETURN_TYPES.join(", ")}`, 400);
    }

    return await questionRepository.CreateQuestion(
        title, description, difficulty, returnType, params || '', userId, isContestOnly ? 1 : 0
    );
};

/* Admins see both pools; everyone else sees practice questions only. */
const getAllQuestions = async (user) => {
    return await questionRepository.GetAllQuestions(user?.role === "ADMIN");
};

/**
 * A private contest question is readable by a non-admin only while its
 * contest is running and the caller is registered for it. Outside that
 * window it behaves as if it does not exist in the practice pool.
 */
const getQuestionById = async (id, user) => {

    const question = await questionRepository.GetQuestionById(id);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (question.is_contest_only && user?.role !== "ADMIN") {
        const allowed = await questionRepository.IsLiveContestQuestionForUser(id, user.id);
        if (!allowed) {
            throw new AppError("This question is only available during its contest", 403);
        }
    }

    return question;
};

/* Route is ADMIN-only; any admin may curate any question. */
const updateQuestion = async (id, title, description, difficulty, returnType, params) => {

    const question = await questionRepository.GetQuestionById(id);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
        throw new AppError("Invalid difficulty. Must be Low, Medium, or High", 400);
    }

    if (returnType && !VALID_RETURN_TYPES.includes(returnType)) {
        throw new AppError(`Invalid return type. Must be one of: ${VALID_RETURN_TYPES.join(", ")}`, 400);
    }

    return await questionRepository.UpdateQuestion(
        id,
        title !== undefined ? title : question.title,
        description !== undefined ? description : question.description,
        difficulty || question.difficluty,
        returnType || question.return_type,
        params !== undefined ? params : question.params
    );
};

const deleteQuestion = async (id) => {

    const question = await questionRepository.GetQuestionById(id);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    return await questionRepository.DeleteQuestion(id);
};

module.exports = { createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion };
