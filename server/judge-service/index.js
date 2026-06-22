const express = require('express');
const cors = require('cors');
const body_parser = require("body-parser");
require("dotenv").config();
const pool = require('./db/connect');
const { client } = require('./config/redis');
const { consumeSubmissions, getRabbitMQStatus } = require("./consumer/RabbitMQConsumer");
const { connectRedis } = require("./config/redis");
const { connectScoredProducer } = require("./producer/RabbitMQProducer");
const { getAll: getMetrics } = require("./metrics");
const { createLogger } = require("../shared/logger/logger");
const { authenticationMiddleware } = require("./middleware/auth");
const { judgeSubmission, runCode } = require("./services/JudgeService");
const judgeRepository = require("./repository/JudgeRepository");

const logger = createLogger("judge-service");
const app = express();

app.use(cors());
app.use(express.json());
app.use(body_parser.json());

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.get("/health", (_req, res) => {
    res.json({ status: "UP", service: "judge-service" });
});

app.get("/metrics", (_req, res) => {
    res.json({
        ...getMetrics(),
        rabbitmqConnected: getRabbitMQStatus(),
        redisConnected: client.isReady,
    });
});

// ── Synchronous run endpoint (no DB record, first 2 sample test cases only) ──
app.post("/api/v1/judge/run", authenticationMiddleware, async (req, res) => {
    const { questionId, language, sourceCode } = req.body;

    if (!questionId || !language || !sourceCode) {
        return res.status(400).json({ error: "questionId, language, and sourceCode are required" });
    }

    try {
        const allCases = await judgeRepository.getTestCasesByQuestionId(questionId);
        const sampleCases = allCases.slice(0, 2);

        if (sampleCases.length === 0) {
            return res.status(200).json({ status: "ACCEPTED", passed: 0, total: 0, execution_time_ms: 0 });
        }

        const result = await runCode(language, sourceCode, sampleCases);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Run endpoint error", { error: err.message });
        res.status(500).json({ error: "Internal server error" });
    }
});

const port = process.env.PORT || 4005;

async function connectDB() {
    try {
        const connection = await pool.getConnection();
        logger.info("MySQL connected");
        connection.release();
    } catch (error) {
        logger.error("MySQL connection failed", { error: error.message });
    }
}

const start = async () => {
    try {
        await connectDB();
        await connectRedis();
        await connectScoredProducer();
        await consumeSubmissions();

        app.listen(port, () => {
            logger.info(`Judge Service running on port ${port}`);
        });
    } catch (error) {
        logger.error("Judge Service startup failed", { error: error.message });
    }
};

start();
