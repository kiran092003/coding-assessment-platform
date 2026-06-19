const contestRepository = require("../repository/ContestRepository");
const AppError = require("../utils/AppError");

const createContest = async (title, description, startTime, endTime, userId) => {

    if (new Date(startTime) >= new Date(endTime)) {
        throw new AppError("start_time must be before end_time", 400);
    }

    return await contestRepository.CreateContest(title, description, startTime, endTime, userId);
};

const getAllContests = async () => {
    return await contestRepository.GetAllContests();
};

const getContestById = async (id) => {

    const contest = await contestRepository.GetContestById(id);
    if (!contest) {
        throw new AppError("Contest not found", 404);
    }

    return contest;
};

const updateContest = async (id, title, description, startTime, endTime, userId) => {

    const contest = await contestRepository.GetContestById(id);
    if (!contest) {
        throw new AppError("Contest not found", 404);
    }

    if (contest.created_by !== userId) {
        throw new AppError("You are not authorized to update this contest", 403);
    }

    const resolvedStart = startTime || contest.start_time;
    const resolvedEnd = endTime || contest.end_time;

    if (new Date(resolvedStart) >= new Date(resolvedEnd)) {
        throw new AppError("start_time must be before end_time", 400);
    }

    return await contestRepository.UpdateContest(id, title, description, startTime, endTime);
};

const deleteContest = async (id, userId) => {

    const contest = await contestRepository.GetContestById(id);
    if (!contest) {
        throw new AppError("Contest not found", 404);
    }

    if (contest.created_by !== userId) {
        throw new AppError("You are not authorized to delete this contest", 403);
    }

    return await contestRepository.DeleteContest(id);
};

module.exports = {
    createContest,
    getAllContests,
    getContestById,
    updateContest,
    deleteContest
};
