const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();
const { createLogger } = require("../shared/logger/logger");

const logger = createLogger("api-gateway");
const app = express();

const {
    AUTH_SERVICE_URL,
    QUESTION_SERVICE_URL,
    CONTEST_SERVICE_URL,
    SUBMISSION_SERVICE_URL,
    JUDGE_SERVICE_URL,
    LEADERBOARD_SERVICE_URL
} = process.env;

app.use(cors());

/* The gateway sits behind the frontend's nginx, so without this every request
   appears to come from nginx's address and the per-IP limiter throttles all
   users collectively — one busy client could lock out the whole platform. */
app.set('trust proxy', 1);

/* General traffic. Polling a submission's verdict alone costs several
   requests per second, so the old 200-per-15-minutes ceiling was reachable
   during normal use. */
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

/* Authentication is the one surface worth rate-limiting hard: this is what
   makes credential stuffing and password guessing impractical. */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Too many authentication attempts. Please try again later.' },
});
app.use(['/api/v1/login', '/api/v1/register'], authLimiter);

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.get('/health', (_req, res) => {
    res.json({
        status: 'UP',
        service: 'api-gateway',
        services: {
            auth: AUTH_SERVICE_URL,
            question: QUESTION_SERVICE_URL,
            contest: CONTEST_SERVICE_URL,
            submission: SUBMISSION_SERVICE_URL,
            judge: JUDGE_SERVICE_URL,
            leaderboard: LEADERBOARD_SERVICE_URL,
        },
    });
});

app.get('/metrics', (_req, res) => {
    res.json({
        uptime: Math.floor(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
});

const proxyOptions = (target) => ({
    target,
    changeOrigin: true,
    on: {
        error: (err, _req, res) => {
            logger.error(`Proxy error → ${target}`, { error: err.message });
            res.status(502).json({ error: 'Service unavailable' });
        },
    },
});

app.use(
    ['/api/v1/register', '/api/v1/login', '/api/v1/refresh', '/api/v1/logout', '/api/v1/profile'],
    createProxyMiddleware(proxyOptions(AUTH_SERVICE_URL))
);

app.use(
    ['/api/v1/questions', '/api/v1/testcases'],
    createProxyMiddleware(proxyOptions(QUESTION_SERVICE_URL))
);

app.use(
    ['/api/v1/contests', '/api/v1/contest-questions'],
    createProxyMiddleware(proxyOptions(CONTEST_SERVICE_URL))
);

app.use(
    '/api/v1/submissions',
    createProxyMiddleware(proxyOptions(SUBMISSION_SERVICE_URL))
);

app.use(
    '/api/v1/judge',
    createProxyMiddleware(proxyOptions(JUDGE_SERVICE_URL))
);

app.use(
    '/api/v1/leaderboard',
    createProxyMiddleware(proxyOptions(LEADERBOARD_SERVICE_URL))
);

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    logger.info(`API Gateway running on port ${port}`);
    logger.info(`auth-service       → ${AUTH_SERVICE_URL}`);
    logger.info(`question-service   → ${QUESTION_SERVICE_URL}`);
    logger.info(`contest-service    → ${CONTEST_SERVICE_URL}`);
    logger.info(`submission-service → ${SUBMISSION_SERVICE_URL}`);
    logger.info(`judge-service      → ${JUDGE_SERVICE_URL}`);
    logger.info(`leaderboard-service → ${LEADERBOARD_SERVICE_URL}`);
});
