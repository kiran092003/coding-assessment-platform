const http = require("http");
const express = require("express");
const cors = require("cors");
const body_parser = require("body-parser");
require("dotenv").config();
const pool = require("./db/connect");
const { client } = require("./config/redis");
const { connectRedis } = require("./config/redis");
const { consumeScoredSubmissions, getRabbitMQStatus } = require("./consumer/RabbitMQConsumer");
const { initSocket } = require("./socket/socket");
const LeaderboardRouter = require("./router/LeaderboardRouter");
const { getAll: getMetrics } = require("./metrics");
const { createLogger } = require("../shared/logger/logger");

const logger = createLogger("leaderboard-service");
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(body_parser.json());
app.use("/api/v1/leaderboard", LeaderboardRouter);

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.get("/health", (_req, res) => {
    res.json({ status: "UP", service: "leaderboard-service" });
});

app.get("/metrics", (_req, res) => {
    res.json({
        ...getMetrics(),
        rabbitmqConnected: getRabbitMQStatus(),
        redisConnected: client.isReady,
    });
});

const port = process.env.PORT || 4006;

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
        await consumeScoredSubmissions();

        initSocket(server);

        server.listen(port, () => {
            logger.info(`Leaderboard Service running on port ${port}`);
        });
    } catch (error) {
        logger.error("Leaderboard Service startup failed", { error: error.message });
    }
};

start();
