const testCaseService = require("../services/TestCaseService");
const { client } = require("../config/redis");

/* Cache keys are scoped by audience. An admin response contains hidden cases
   and expected outputs; serving that from a shared key would hand them to the
   next regular user who asked. */
const scopeOf = (user) => (user?.role === "ADMIN" ? "admin" : `user:${user.id}`);

const invalidateQuestion = async (questionId) => {
    const keys = await client.keys(`testcases:q:${questionId}:*`);
    await Promise.all([
        client.del("testcases:all"),
        ...(keys.length ? [client.del(keys)] : []),
    ]);
};

const CreateTestCase = async (req, res) => {
    try {

        const { questionId, inputData, expectedOutput, isHidden } = req.body;

        if (!questionId || !inputData || !expectedOutput) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        const testCase = await testCaseService.createTestCase(
            questionId,
            inputData.trim(),
            expectedOutput.trim(),
            req.user.id,
            isHidden === true || isHidden === 1 || isHidden === "true"
        );

        await invalidateQuestion(questionId);

        res.status(201).json({ message: "Test case created", testCaseId: testCase.insertId });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

/* ADMIN only (enforced on the route). */
const GetAllTestCases = async (req, res) => {
    try {

        const cacheKey = "testcases:all";

        const cachedData = await client.get(cacheKey);
        if (cachedData) {
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
        const cacheKey = `testcases:q:${questionId}:${scopeOf(req.user)}`;

        const cachedData = await client.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const testCases = await testCaseService.getTestCasesByQuestionId(questionId, req.user);

        await client.set(cacheKey, JSON.stringify(testCases), { EX: 60 });

        res.status(200).json(testCases);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

/* ADMIN only (enforced on the route). */
const GetTestCaseById = async (req, res) => {
    try {

        const { id } = req.params;

        const testCase = await testCaseService.getTestCaseById(id);

        res.status(200).json(testCase);

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateTestCase = async (req, res) => {
    try {

        const { id } = req.params;
        const { inputData, expectedOutput, isHidden } = req.body;

        const existing = await testCaseService.getTestCaseById(id);

        await testCaseService.updateTestCase(
            id,
            inputData,
            expectedOutput,
            isHidden === undefined ? undefined : (isHidden === true || isHidden === 1 || isHidden === "true")
        );

        await invalidateQuestion(existing.question_id);

        res.status(200).json({ message: "Test case updated" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const DeleteTestCase = async (req, res) => {
    try {

        const { id } = req.params;

        const existing = await testCaseService.getTestCaseById(id);

        await testCaseService.deleteTestCase(id);

        await invalidateQuestion(existing.question_id);

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
