const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repository/UserRepository");
const AppError = require("../utils/AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
    /^(?=(?:.*\d){2,})(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const VALID_ROLES = ["ADMIN", "USER"];

const register = async (name, email, password, role) => {

    if (!EMAIL_REGEX.test(email)) {
        throw new AppError("Invalid email format", 400);
    }

    if (password.length < 8) {
        throw new AppError("Password must be at least 8 characters", 400);
    }

    if (!PASSWORD_REGEX.test(password)) {
        throw new AppError(
            "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 2 numbers, and 1 special character",
            400
        );
    }

    if (!VALID_ROLES.includes(role)) {
        throw new AppError("Invalid role", 400);
    }

    const existingEmail = await userRepository.GetUserByEmail(email);
    if (existingEmail) {
        throw new AppError("Email already exists", 400);
    }

    const existingName = await userRepository.GetUserByName(name);
    if (existingName) {
        throw new AppError("User with this name already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userRepository.CreateUser(name, email, hashedPassword, role);
};

const login = async (email, password) => {

    const user = await userRepository.GetUserByEmail(email);
    if (!user) {
        throw new AppError("User does not exist", 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 400);
    }

    const accessToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    await userRepository.SaveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, userId: user.id };
};

const refreshAccessToken = async (refreshToken) => {

    const tokenInDb = await userRepository.GetRefreshToken(refreshToken);
    if (!tokenInDb) {
        throw new AppError("Invalid refresh token", 403);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await userRepository.GetUserById(decoded.id);
    if (!user) {
        throw new AppError("User not found", 403);
    }

    const accessToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    return { accessToken };
};

const logout = async (refreshToken) => {
    await userRepository.DeleteRefreshToken(refreshToken);
};

const getProfile = async (userId) => {
    const user = await userRepository.GetUserById(userId);
    if (!user) throw new AppError('User not found', 404);
    const { password: _pwd, ...profile } = user;
    return profile;
};

const updateProfile = async (userId, name) => {
    if (!name || name.trim().length < 2) throw new AppError('Name must be at least 2 characters', 400);
    const existing = await userRepository.GetUserByName(name.trim());
    if (existing && existing.id !== userId) throw new AppError('Name already taken', 400);
    await userRepository.UpdateUserName(userId, name.trim());
    const user = await userRepository.GetUserById(userId);
    const { password: _pwd, ...profile } = user;
    return profile;
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userRepository.GetUserById(userId);
    if (!user) throw new AppError('User not found', 404);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);
    if (!PASSWORD_REGEX.test(newPassword)) {
        throw new AppError('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 2 numbers, and 1 special character', 400);
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.UpdateUserPassword(userId, hashed);
};

module.exports = {
    register,
    login,
    refreshAccessToken,
    logout,
    getProfile,
    updateProfile,
    changePassword
};
