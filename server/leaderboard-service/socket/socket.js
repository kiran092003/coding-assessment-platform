const { Server } = require("socket.io");
const leaderboardRepository = require("../repository/LeaderboardRepository");

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Frontend joins a contest room to receive live leaderboard updates
        socket.on("joinContest", async (contestId) => {
            socket.join(`leaderboard:${contestId}`);
            console.log(`[Socket.IO] Client ${socket.id} joined leaderboard:${contestId}`);
            // Send current leaderboard immediately so the page doesn't wait for next event
            try {
                const current = await leaderboardRepository.getLeaderboard(contestId, 50);
                socket.emit("leaderboardUpdate", current);
            } catch (err) {
                console.error("[Socket.IO] Failed to send initial leaderboard", err.message);
            }
        });

        socket.on("leaveContest", (contestId) => {
            socket.leave(`leaderboard:${contestId}`);
        });

        socket.on("disconnect", () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
