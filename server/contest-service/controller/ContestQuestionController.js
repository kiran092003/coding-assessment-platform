const contestQuestionService = require("../services/ContestQuestionService");
const { client } = require("../config/redis");

const AddQuestionToContest = async (req, res) => {
    try {

        const { contestId, questionId, points } = req.body;

        if (!contestId || !questionId) {
            return res.status(400).json({ error: "contestId and questionId are required" });
        }

        await contestQuestionService.addQuestionToContest(contestId, questionId, points ?? null);

        await client.del(`contest:questions:${contestId}`);

        res.status(201).json({ message: "Question mapped to contest successfully" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateQuestionPoints = async (req, res) => {
    try {

        const { contestId, questionId } = req.params;
        const { points } = req.body;

        await contestQuestionService.updateQuestionPoints(contestId, questionId, points ?? null);

        await client.del(`contest:questions:${contestId}`);

        res.status(200).json({ message: "Points updated successfully" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetQuestionsByContest = async (req, res) => {
    try {

        const { contestId } = req.params;
        const cacheKey = `contest:questions:${contestId}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving questions for contest ${contestId} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const questions = await contestQuestionService.getQuestionsByContest(contestId);

        await client.set(cacheKey, JSON.stringify(questions), { EX: 300 });

        res.status(200).json(questions);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const RemoveQuestionFromContest = async (req, res) => {
    try {

        const { contestId, questionId } = req.params;

        await contestQuestionService.removeQuestionFromContest(contestId, questionId);

        await client.del(`contest:questions:${contestId}`);

        res.status(200).json({ message: "Question removed from contest successfully" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    AddQuestionToContest,
    UpdateQuestionPoints,
    GetQuestionsByContest,
    RemoveQuestionFromContest
};
