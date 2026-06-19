const userService = require("../services/UserServices");

const CreateUser = async (req, res) => {
    try {

        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }

        await userService.register(name.trim(), email.trim(), password, role);

        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const Login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        const result = await userService.login(email, password);

        res.status(200).json({ message: "Login successful", ...result });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const RefreshAccessToken = async (req, res) => {
    try {

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token required" });
        }

        const result = await userService.refreshAccessToken(refreshToken);

        res.status(200).json(result);

    } catch (error) {
        res.status(error.statusCode || 403).json({ error: error.message });
    }
};

const Logout = async (req, res) => {
    try {

        const { refreshToken } = req.body;

        await userService.logout(refreshToken);

        res.status(200).json({ message: "Logged out" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = { CreateUser, Login, RefreshAccessToken, Logout };
