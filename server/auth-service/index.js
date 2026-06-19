const express = require('express');
const cors = require('cors');
const body_parser = require("body-parser");
require("dotenv").config();
const pool = require('./db/connect');
const { client } = require('./config/redis');
const UserRouter = require("./router/UserRoutes");
const { connectRedis } = require("./config/redis");
const { createLogger } = require("../shared/logger/logger");

const logger = createLogger("auth-service");
const app = express();

app.use(cors());
app.use(express.json());
app.use(body_parser.json());
app.use("/api/v1", UserRouter);

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.get("/health", (_req, res) => {
    res.json({ status: "UP", service: "auth-service" });
});

app.get("/metrics", (_req, res) => {
    res.json({ redisConnected: client.isReady });
});

const port = process.env.PORT || 4001;

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
            logger.info(`Auth Service running on port ${port}`);
        });
    } catch (error) {
        logger.error("Auth Service startup failed", { error: error.message });
    }
};

start();
