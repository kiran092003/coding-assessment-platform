const { Server } = require("socket.io");

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Frontend joins a contest room to receive live leaderboard updates
        socket.on("joinContest", (contestId) => {
            socket.join(`leaderboard:${contestId}`);
            console.log(`[Socket.IO] Client ${socket.id} joined leaderboard:${contestId}`);
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
