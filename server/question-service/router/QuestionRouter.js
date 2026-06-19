const express = require("express");
const routers = express.Router();

const {
    CreateQuestion,
    GetAllQuestions,
    GetQuestionById,
    UpdateQuestion,
    DeleteQuestion
} = require("../controller/QuestionController");
const { authenticationMiddleware, authorizeRole } = require("../middleware/auth");

routers.route("/create").post(authenticationMiddleware, authorizeRole("ADMIN"), CreateQuestion);
routers.route("/getAll").get(authenticationMiddleware, GetAllQuestions);
routers.route("/getById/:id").get(authenticationMiddleware, GetQuestionById);
routers.route("/update/:id").patch(authenticationMiddleware, authorizeRole("ADMIN"), UpdateQuestion);
routers.route("/delete/:id").delete(authenticationMiddleware, authorizeRole("ADMIN"), DeleteQuestion);

module.exports = routers;
