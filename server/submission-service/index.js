const http = require("http");
const express = require('express');
const cors = require('cors');
const body_parser = require("body-parser");
require("dotenv").config();
const pool = require('./db/connect');
const { client } = require('./config/redis');
const SubmissionRouter = require("./router/SubmissionRouter");
const { connectQueue, getRabbitMQStatus } = require("./producer/RabbitMQProducer");
const { connectRedis } = require("./config/redis");
const { initSocket } = require("./socket/socket");
const { getAll: getMetrics } = require("./metrics");
const { createLogger } = require("../shared/logger/logger");

const logger = createLogger("submission-service");
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(body_parser.json());
app.use("/api/v1/submissions", SubmissionRouter);

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, { userId: req.user?.id });
    next();
});

app.get("/health", (_req, res) => {
    res.json({ status: "UP", service: "submission-service" });
});

app.get("/metrics", (_req, res) => {
    res.json({
        ...getMetrics(),
        rabbitmqConnected: getRabbitMQStatus(),
        redisConnected: client.isReady,
    });
});

const port = process.env.PORT || 4004;

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
        await connectQueue();
        await connectRedis();

        initSocket(server);

        server.listen(port, () => {
            logger.info(`Submission Service running on port ${port}`);
        });
    } catch (error) {
        logger.error("Submission Service startup failed", { error: error.message });
    }
};

start();
