const questionService = require("../services/QuestionService");
const { client } = require("../config/redis");

const CreateQuestion = async (req, res) => {
    try {

        const { title, description, difficluty } = req.body;

        if (!title || !description || !difficluty) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        const question = await questionService.createQuestion(
            title.trim(),
            description.trim(),
            difficluty.trim(),
            req.user.id
        );

        await client.del("questions:all");

        res.status(201).json({ message: "Question created", questionId: question.insertId });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetAllQuestions = async (req, res) => {
    try {

        const cacheKey = "questions:all";

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log("Serving from Redis");
            return res.status(200).json(JSON.parse(cachedData));
        }

        const questions = await questionService.getAllQuestions();

        await client.set(cacheKey, JSON.stringify(questions), { EX: 300 });

        res.status(200).json(questions);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetQuestionById = async (req, res) => {
    try {

        const { id } = req.params;
        const cacheKey = `question:${id}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving question ${id} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const question = await questionService.getQuestionById(id);

        await client.set(cacheKey, JSON.stringify(question), { EX: 300 });

        res.status(200).json(question);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateQuestion = async (req, res) => {
    try {

        const { id } = req.params;
        const { title, description, difficluty } = req.body;

        await questionService.updateQuestion(id, title, description, difficluty, req.user.id);

        await Promise.all([
            client.del(`question:${id}`),
            client.del("questions:all"),
        ]);

        res.status(200).json({ message: "Question updated" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const DeleteQuestion = async (req, res) => {
    try {

        const { id } = req.params;

        await questionService.deleteQuestion(id, req.user.id);

        await Promise.all([
            client.del(`question:${id}`),
            client.del("questions:all"),
        ]);

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
