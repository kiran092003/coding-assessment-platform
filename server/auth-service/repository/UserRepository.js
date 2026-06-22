const pool = require('../db/connect');
const { client } = require('../config/redis');

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

const CreateUser = async (name, email, password, role) => {
    try {
        const [rows] = await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);
        return rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const GetUserByName = async (name) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE name = ?', [name]);
        return rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const GetUserByEmail = async (email) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const GetUserById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Refresh tokens stored in Redis instead of DB — auto-expires after 7 days
const SaveRefreshToken = async (userId, token) => {
    await client.set(`refresh:${token}`, userId.toString(), { EX: REFRESH_TOKEN_TTL });
};

const GetRefreshToken = async (token) => {
    const userId = await client.get(`refresh:${token}`);
    return userId ? { user_id: userId, token } : null;
};

const DeleteRefreshToken = async (token) => {
    await client.del(`refresh:${token}`);
};

const UpdateUserName = async (id, name) => {
    try {
        const [result] = await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const UpdateUserPassword = async (id, hashedPassword) => {
    try {
        const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports = {
    CreateUser,
    GetUserByName,
    GetUserByEmail,
    GetUserById,
    SaveRefreshToken,
    GetRefreshToken,
    DeleteRefreshToken,
    UpdateUserName,
    UpdateUserPassword
};
