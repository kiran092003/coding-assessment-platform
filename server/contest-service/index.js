const express = require('express');
const cors = require('cors');
const body_parser = require("body-parser");
require("dotenv").config();
const pool = require('./db/connect');
const { client } = require('./config/redis');
const ContestRouter = require("./router/ContestRouter");
const ContestQuestionRouter = require("./router/ContestQuestionRouter");
const { connectRedis } = require("./config/redis");
const { createLogger } = require("../shared/logger/logger");

const logger = createLogger("contest-service");
const app = express();

app.use(cors());
app.use(express.json());
app.use(body_parser.json());
app.use("/api/v1/contests", ContestRouter);
app.use("/api/v1/contest-questions", ContestQuestionRouter);

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.get("/health", (_req, res) => {
    res.json({ status: "UP", service: "contest-service" });
});

app.get("/metrics", (_req, res) => {
    res.json({ redisConnected: client.isReady });
});

const port = process.env.PORT || 4003;

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
            logger.info(`Contest Service running on port ${port}`);
        });
    } catch (error) {
        logger.error("Contest Service startup failed", { error: error.message });
    }
};

start();
