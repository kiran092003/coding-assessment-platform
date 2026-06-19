const express = require("express");
const router = express.Router();
const { GetLeaderboard } = require("../controller/LeaderboardController");
const { authenticationMiddleware } = require("../middleware/auth");

router.get("/:contestId", authenticationMiddleware, GetLeaderboard);

module.exports = router;
