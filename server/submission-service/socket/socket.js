const { Server } = require("socket.io");
const redis = require("redis");
const pool = require("../db/connect");

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: "*" }
    });

    // Dedicated subscriber client — a subscribed Redis client cannot run
    // other commands, so we keep it separate from the caching client.
    const subscriber = redis.createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

    subscriber.on("error", (err) => console.error("Redis Subscriber Error:", err));

    subscriber.connect().then(() => {
        subscriber.subscribe("submission:verdict", (message) => {
            const data = JSON.parse(message);
            console.log(`[Socket] Verdict received for submission ${data.submissionId}: ${data.status}`);
            io.to(`submission:${data.submissionId}`).emit("verdict", data);
        });
        console.log("Redis Pub/Sub subscriber ready");
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // Frontend calls emit('join', submissionId) right after getting the submissionId
        socket.on("join", async (submissionId) => {
            socket.join(`submission:${submissionId}`);
            console.log(`[Socket] Client ${socket.id} joined room submission:${submissionId}`);

            // Send current status immediately to handle the case where the
            // verdict already arrived before the client connected
            const [rows] = await pool.execute(
                "SELECT * FROM submissions WHERE id = ?",
                [submissionId]
            );
            if (rows[0]) {
                const s = rows[0];
                socket.emit("verdict", {
                    submissionId: s.id,
                    status: s.status,
                    passedTestcases: s.passed_testcases,
                    totalTestcases: s.total_testcases,
                    executionTimeMs: s.execution_time_ms
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = { initSocket };
