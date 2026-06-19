const jwt = require("jsonwebtoken");

const authenticationMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") return res.status(401).json({ error: "Token expired" });
        return res.status(401).json({ error: "Invalid token" });
    }
};

const authorizeRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Access denied" });
    next();
};

module.exports = { authenticationMiddleware, authorizeRole };
