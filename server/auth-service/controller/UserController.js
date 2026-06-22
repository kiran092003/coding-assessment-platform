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

const GetProfile = async (req, res) => {
    try {
        const profile = await userService.getProfile(req.user.id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const UpdateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const profile = await userService.updateProfile(req.user.id, name);
        res.status(200).json({ message: 'Profile updated', ...profile });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const ChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }
        await userService.changePassword(req.user.id, currentPassword, newPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = { CreateUser, Login, RefreshAccessToken, Logout, GetProfile, UpdateProfile, ChangePassword };
