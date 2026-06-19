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
