const contestService = require("../services/ContestService");
const { client } = require("../config/redis");

const CreateContest = async (req, res) => {
    try {

        const { title, description, start_time, end_time } = req.body;

        if (!title || !description || !start_time || !end_time) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        const contest = await contestService.createContest(
            title.trim(),
            description.trim(),
            start_time,
            end_time,
            req.user.id
        );

        await client.del("contests:all");

        res.status(201).json({ message: "Contest created", contestId: contest.insertId });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetAllContests = async (req, res) => {
    try {

        const cacheKey = "contests:all";

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log("Serving all contests from Redis");
            return res.status(200).json(JSON.parse(cachedData));
        }

        const contests = await contestService.getAllContests();

        await client.set(cacheKey, JSON.stringify(contests), { EX: 300 });

        res.status(200).json(contests);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetContestById = async (req, res) => {
    try {

        const { id } = req.params;
        const cacheKey = `contest:${id}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving contest ${id} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const contest = await contestService.getContestById(id);

        await client.set(cacheKey, JSON.stringify(contest), { EX: 300 });

        res.status(200).json(contest);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateContest = async (req, res) => {
    try {

        const { id } = req.params;
        const { title, description, start_time, end_time } = req.body;

        await contestService.updateContest(id, title, description, start_time, end_time, req.user.id);

        await Promise.all([
            client.del(`contest:${id}`),
            client.del("contests:all"),
        ]);

        res.status(200).json({ message: "Contest updated" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const DeleteContest = async (req, res) => {
    try {

        const { id } = req.params;

        await contestService.deleteContest(id, req.user.id);

        await Promise.all([
            client.del(`contest:${id}`),
            client.del("contests:all"),
        ]);

        res.status(200).json({ message: "Contest deleted" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const RegisterContest = async (req, res) => {
    try {
        const result = await contestService.registerForContest(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetMyRegistration = async (req, res) => {
    try {
        const result = await contestService.getMyRegistration(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    CreateContest,
    GetAllContests,
    GetContestById,
    UpdateContest,
    DeleteContest,
    RegisterContest,
    GetMyRegistration,
};
