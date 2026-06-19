const express = require("express");
const routers = express.Router();

const { CreateUser, Login, Logout, RefreshAccessToken } = require("../controller/UserController");

routers.route("/register").post(CreateUser);
routers.route("/login").post(Login);
routers.route("/refresh").post(RefreshAccessToken);
routers.route("/logout").post(Logout);

module.exports = routers;
