const questionService = require("../services/QuestionService");
const { client } = require("../config/redis");

/* Admins see the private contest pool as well, so their cached listing must
   not be reused for regular users. */
const scopeOf = (user) => (user?.role === "ADMIN" ? "admin" : "practice");

const invalidateQuestion = async (id) => {
    const keys = await client.keys(`question:${id}:*`);
    await Promise.all([
        client.del("questions:all:admin"),
        client.del("questions:all:practice"),
        ...(keys.length ? [client.del(keys)] : []),
    ]);
};

const CreateQuestion = async (req, res) => {
    try {

        const { title, description, difficluty, return_type, params, isContestOnly } = req.body;

        if (!title || !description || !difficluty || !return_type) {
            return res.status(400).json({ error: "Required fields missing (title, description, difficluty, return_type)" });
        }

        const question = await questionService.createQuestion(
            title.trim(),
            description.trim(),
            difficluty.trim(),
            return_type.trim(),
            (params || '').trim(),
            req.user.id,
            isContestOnly === true || isContestOnly === 1 || isContestOnly === "true"
        );

        await Promise.all([
            client.del("questions:all:admin"),
            client.del("questions:all:practice"),
        ]);

        res.status(201).json({ message: "Question created", questionId: question.insertId });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetAllQuestions = async (req, res) => {
    try {

        const cacheKey = `questions:all:${scopeOf(req.user)}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const questions = await questionService.getAllQuestions(req.user);

        await client.set(cacheKey, JSON.stringify(questions), { EX: 300 });

        res.status(200).json(questions);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetQuestionById = async (req, res) => {
    try {

        const { id } = req.params;
        const cacheKey = `question:${id}:${scopeOf(req.user)}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const question = await questionService.getQuestionById(id, req.user);

        await client.set(cacheKey, JSON.stringify(question), { EX: 300 });

        res.status(200).json(question);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateQuestion = async (req, res) => {
    try {

        const { id } = req.params;
        const { title, description, difficluty, return_type, params, isContestOnly } = req.body;

        await questionService.updateQuestion(id, title, description, difficluty, return_type, params);

        await invalidateQuestion(id);

        res.status(200).json({ message: "Question updated" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const DeleteQuestion = async (req, res) => {
    try {

        const { id } = req.params;

        await questionService.deleteQuestion(id);

        await invalidateQuestion(id);

        res.status(200).json({ message: "Question deleted" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    CreateQuestion,
    GetAllQuestions,
    GetQuestionById,
    UpdateQuestion,
    DeleteQuestion
};
