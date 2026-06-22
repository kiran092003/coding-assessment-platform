const express = require("express");
const routers = express.Router();

const {
    CreateSubmission,
    GetSubmissionById,
    GetSubmissionsByUserAndQuestion,
    GetSubmissionsByQuestion,
    DeleteSubmission,
    GetMyAllSubmissions
} = require("../controller/SubmissionController");
const { authenticationMiddleware, authorizeRole } = require("../middleware/auth");
const { rateLimitSubmission } = require("../middleware/rateLimitSubmission");

routers.route("/me").get(authenticationMiddleware, GetMyAllSubmissions);
routers.route("/create").post(authenticationMiddleware, rateLimitSubmission, CreateSubmission);
routers.route("/getById/:id").get(authenticationMiddleware, GetSubmissionById);
routers.route("/mySubmissions/:questionId").get(authenticationMiddleware, GetSubmissionsByUserAndQuestion);
routers.route("/question/:questionId").get(authenticationMiddleware, authorizeRole("ADMIN"), GetSubmissionsByQuestion);
routers.route("/delete/:id").delete(authenticationMiddleware, authorizeRole("ADMIN"), DeleteSubmission);

module.exports = routers;
