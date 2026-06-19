const testCaseService = require("../services/TestCaseService");
const { client } = require("../config/redis");

const CreateTestCase = async (req, res) => {
    try {

        const { questionId, inputData, expectedOutput } = req.body;

        if (!questionId || !inputData || !expectedOutput) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        const testCase = await testCaseService.createTestCase(
            questionId,
            inputData.trim(),
            expectedOutput.trim(),
            req.user.id
        );

        await Promise.all([
            client.del("testcases:all"),
            client.del(`testcases:question:${questionId}`),
        ]);

        res.status(201).json({ message: "Test case created", testCaseId: testCase.insertId });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetAllTestCases = async (req, res) => {
    try {

        const cacheKey = "testcases:all";

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log("Serving all test cases from Redis");
            return res.status(200).json(JSON.parse(cachedData));
        }

        const testCases = await testCaseService.getAllTestCases();

        await client.set(cacheKey, JSON.stringify(testCases), { EX: 300 });

        res.status(200).json(testCases);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetTestCasesByQuestionId = async (req, res) => {
    try {

        const { questionId } = req.params;
        const cacheKey = `testcases:question:${questionId}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving test cases for question ${questionId} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const testCases = await testCaseService.getTestCasesByQuestionId(questionId);

        await client.set(cacheKey, JSON.stringify(testCases), { EX: 300 });

        res.status(200).json(testCases);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const GetTestCaseById = async (req, res) => {
    try {

        const { id } = req.params;
        const cacheKey = `testcase:${id}`;

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log(`Serving test case ${id} from Redis`);
            return res.status(200).json(JSON.parse(cachedData));
        }

        const testCase = await testCaseService.getTestCaseById(id);

        await client.set(cacheKey, JSON.stringify(testCase), { EX: 300 });

        res.status(200).json(testCase);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateTestCase = async (req, res) => {
    try {

        const { id } = req.params;
        const { inputData, expectedOutput } = req.body;

        await testCaseService.updateTestCase(id, inputData, expectedOutput, req.user.id);

        await Promise.all([
            client.del(`testcase:${id}`),
            client.del("testcases:all"),
        ]);

        res.status(200).json({ message: "Test case updated" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const DeleteTestCase = async (req, res) => {
    try {

        const { id } = req.params;

        await testCaseService.deleteTestCase(id, req.user.id);

        await Promise.all([
            client.del(`testcase:${id}`),
            client.del("testcases:all"),
        ]);

        res.status(200).json({ message: "Test case deleted" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    CreateTestCase,
    GetAllTestCases,
    GetTestCasesByQuestionId,
    GetTestCaseById,
    UpdateTestCase,
    DeleteTestCase
};
