const questionRepository = require("../repository/QuestionRepository");
const AppError = require("../utils/AppError");

const VALID_DIFFICULTIES = ["Low", "Medium", "High"];
const VALID_RETURN_TYPES = ["int", "long long", "double", "bool", "string", "vector<int>", "vector<string>", "vector<vector<int>>", "void"];

const createQuestion = async (title, description, difficulty, returnType, params, userId) => {

    if (!VALID_DIFFICULTIES.includes(difficulty)) {
        throw new AppError("Invalid difficulty. Must be Low, Medium, or High", 400);
    }

    if (!VALID_RETURN_TYPES.includes(returnType)) {
        throw new AppError(`Invalid return type. Must be one of: ${VALID_RETURN_TYPES.join(", ")}`, 400);
    }

    return await questionRepository.CreateQuestion(title, description, difficulty, returnType, params || '', userId);
};

const getAllQuestions = async () => {
    return await questionRepository.GetAllQuestions();
};

const getQuestionById = async (id) => {

    const question = await questionRepository.GetQuestionById(id);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    return question;
};

const updateQuestion = async (id, title, description, difficulty, returnType, params, userId) => {

    const question = await questionRepository.GetQuestionById(id);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (question.created_by !== userId) {
        throw new AppError("You are not authorized to update this question", 403);
    }

    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
        throw new AppError("Invalid difficulty. Must be Low, Medium, or High", 400);
    }

    if (returnType && !VALID_RETURN_TYPES.includes(returnType)) {
        throw new AppError(`Invalid return type. Must be one of: ${VALID_RETURN_TYPES.join(", ")}`, 400);
    }

    return await questionRepository.UpdateQuestion(
        id, title, description,
        difficulty || question.difficluty,
        returnType || question.return_type,
        params !== undefined ? params : question.params
    );
};

const deleteQuestion = async (id, userId) => {

    const question = await questionRepository.GetQuestionById(id);
    if (!question) {
        throw new AppError("Question not found", 404);
    }

    if (question.created_by !== userId) {
        throw new AppError("You are not authorized to delete this question", 403);
    }

    return await questionRepository.DeleteQuestion(id);
};

module.exports = { createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion };
