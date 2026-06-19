const submissionService = require("../services/SubmissionService");
const { client } = require("../config/redis");

const CreateSubmission = async (req, res) => {
    try {

        const { questionId, language, sourceCode, contestId } = req.body;

        if (!questionId || !language || !sourceCode) {
            return res.status(400).json({ error: "questionId, language, and sourceCode are required" });
        }

        const result = await submissionService.createSubmission(
            req.user.id,
            questionId,
            language,
            sourceCode,
            contestId || null
        );

        // Invalidate the user's submission history for this question
        await client.del(`submissions:user:${req.user.id}:question:${questionId}`);

        res.status(201).json({ message: "Submission created", submissionId: result.insertId });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetSubmissionById = async (req, res) => {
    try {

        const { id } = req.params;
        const cacheKey = `submission:${id}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const submission = await submissionService.getSubmissionById(id, req.user.id);

        // Short TTL — submission status changes as judge processes it
        await client.set(cacheKey, JSON.stringify(submission), { EX: 10 });

        res.status(200).json(submission);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetSubmissionsByUserAndQuestion = async (req, res) => {
    try {

        const { questionId } = req.params;
        const cacheKey = `submissions:user:${req.user.id}:question:${questionId}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving submissions for user ${req.user.id} / question ${questionId} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const submissions = await submissionService.getSubmissionsByUserAndQuestion(req.user.id, questionId);

        await client.set(cacheKey, JSON.stringify(submissions), { EX: 60 });

        res.status(200).json(submissions);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetSubmissionsByQuestion = async (req, res) => {
    try {

        const { questionId } = req.params;
        const cacheKey = `submissions:question:${questionId}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving all submissions for question ${questionId} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const submissions = await submissionService.getSubmissionsByQuestion(questionId);

        await client.set(cacheKey, JSON.stringify(submissions), { EX: 60 });

        res.status(200).json(submissions);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const DeleteSubmission = async (req, res) => {
    try {

        const { id } = req.params;

        await submissionService.deleteSubmission(id, req.user.id);

        await client.del(`submission:${id}`);

        res.status(200).json({ message: "Submission deleted" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    CreateSubmission,
    GetSubmissionById,
    GetSubmissionsByUserAndQuestion,
    GetSubmissionsByQuestion,
    DeleteSubmission
};
