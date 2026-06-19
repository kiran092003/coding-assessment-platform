const express = require("express");
const routers = express.Router();

const {
    CreateTestCase,
    GetAllTestCases,
    GetTestCasesByQuestionId,
    GetTestCaseById,
    UpdateTestCase,
    DeleteTestCase
} = require("../controller/TestCaseController");
const { authenticationMiddleware, authorizeRole } = require("../middleware/auth");

routers.route("/create").post(authenticationMiddleware, authorizeRole("ADMIN"), CreateTestCase);
routers.route("/getAll").get(authenticationMiddleware, GetAllTestCases);
routers.route("/getByQuestion/:questionId").get(authenticationMiddleware, GetTestCasesByQuestionId);
routers.route("/getById/:id").get(authenticationMiddleware, GetTestCaseById);
routers.route("/update/:id").patch(authenticationMiddleware, authorizeRole("ADMIN"), UpdateTestCase);
routers.route("/delete/:id").delete(authenticationMiddleware, authorizeRole("ADMIN"), DeleteTestCase);

module.exports = routers;
