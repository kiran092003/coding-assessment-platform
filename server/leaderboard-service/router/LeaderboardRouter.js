const express = require("express");
const router = express.Router();
const { GetLeaderboard, GetMyEntry, RecordStart, RecordEnd } = require("../controller/LeaderboardController");
const { authenticationMiddleware } = require("../middleware/auth");

router.get("/:contestId/me",       authenticationMiddleware, GetMyEntry);
router.post("/:contestId/start",   authenticationMiddleware, RecordStart);
router.post("/:contestId/end",     authenticationMiddleware, RecordEnd);
router.get("/:contestId",          authenticationMiddleware, GetLeaderboard);

module.exports = router;
