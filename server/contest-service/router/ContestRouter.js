const express = require("express");
const routers = express.Router();

const {
    CreateContest,
    GetAllContests,
    GetContestById,
    UpdateContest,
    DeleteContest,
    RegisterContest,
    GetMyRegistration,
} = require("../controller/ContestController");
const { authenticationMiddleware, authorizeRole } = require("../middleware/auth");

routers.route("/create").post(authenticationMiddleware, authorizeRole("ADMIN"), CreateContest);
routers.route("/getAll").get(authenticationMiddleware, GetAllContests);
routers.route("/getById/:id").get(authenticationMiddleware, GetContestById);
routers.route("/update/:id").patch(authenticationMiddleware, authorizeRole("ADMIN"), UpdateContest);
routers.route("/delete/:id").delete(authenticationMiddleware, authorizeRole("ADMIN"), DeleteContest);
routers.route("/register/:id").post(authenticationMiddleware, RegisterContest);
routers.route("/registration/:id").get(authenticationMiddleware, GetMyRegistration);

module.exports = routers;
