const express = require("express");
const routers = express.Router();

const { CreateUser, Login, Logout, RefreshAccessToken, GetProfile, UpdateProfile, ChangePassword } = require("../controller/UserController");
const { authenticationMiddleware } = require("../middleware/auth");

routers.route("/register").post(CreateUser);
routers.route("/login").post(Login);
routers.route("/refresh").post(RefreshAccessToken);
routers.route("/logout").post(Logout);
routers.route("/profile").get(authenticationMiddleware, GetProfile);
routers.route("/profile").put(authenticationMiddleware, UpdateProfile);
routers.route("/profile/password").put(authenticationMiddleware, ChangePassword);

module.exports = routers;
