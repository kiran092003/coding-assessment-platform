const express = require("express");
const routers = express.Router();

const {
    AddQuestionToContest,
    UpdateQuestionPoints,
    GetQuestionsByContest,
    RemoveQuestionFromContest
} = require("../controller/ContestQuestionController");
const { authenticationMiddleware, authorizeRole } = require("../middleware/auth");

routers.route("/add").post(authenticationMiddleware, authorizeRole("ADMIN"), AddQuestionToContest);
routers.route("/points/:contestId/:questionId").patch(authenticationMiddleware, authorizeRole("ADMIN"), UpdateQuestionPoints);
routers.route("/:contestId").get(authenticationMiddleware, GetQuestionsByContest);
routers.route("/remove/:contestId/:questionId").delete(authenticationMiddleware, authorizeRole("ADMIN"), RemoveQuestionFromContest);

module.exports = routers;
