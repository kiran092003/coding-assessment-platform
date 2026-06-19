const express = require('express');
const cors = require('cors');
const body_parser = require("body-parser");
require("dotenv").config();
const pool = require('./db/connect');
const { client } = require('./config/redis');
const QuestionRouter = require("./router/QuestionRouter");
const TestCaseRouter = require("./router/TestCaseRouter");
const { connectRedis } = require("./config/redis");
const { createLogger } = require("../shared/logger/logger");

const logger = createLogger("question-service");
const app = express();

app.use(cors());
app.use(express.json());
app.use(body_parser.json());
app.use("/api/v1/questions", QuestionRouter);
app.use("/api/v1/testcases", TestCaseRouter);

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.get("/health", (_req, res) => {
    res.json({ status: "UP", service: "question-service" });
});

app.get("/metrics", (_req, res) => {
    res.json({ redisConnected: client.isReady });
});

const port = process.env.PORT || 4002;

async function connectDB() {
    try {
        const connection = await pool.getConnection();
        logger.info("MySQL connected");
        connection.release();
    } catch (error) {
        logger.error("MySQL connection failed", { error: error.message });
    }
}

connectDB();

const start = async () => {
    try {
        await connectRedis();
        app.listen(port, () => {
            logger.info(`Question Service running on port ${port}`);
        });
    } catch (error) {
        logger.error("Question Service startup failed", { error: error.message });
    }
};

start();
