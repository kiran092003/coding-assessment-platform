const { client } = require("../config/redis");

const LIMIT = 10;       // max submissions
const WINDOW_SEC = 60;  // per 60 seconds

const rateLimitSubmission = async (req, res, next) => {
    try {
        const key = `submit:user:${req.user.id}`;

        // INCR atomically creates the key at 1 if it doesn't exist,
        // or increments it if it does.
        const count = await client.incr(key);

        // Set TTL only on the first request so the window is fixed,
        // not sliding.
        if (count === 1) {
            await client.expire(key, WINDOW_SEC);
        }

        if (count > LIMIT) {
            const ttl = await client.ttl(key);
            return res.status(429).json({
                error: `Rate limit exceeded. You can submit ${LIMIT} times per minute. Try again in ${ttl} second(s).`
            });
        }

        next();

    } catch (err) {
        // If Redis is down, fail open (don't block submissions)
        console.error("Rate limit check failed:", err.message);
        next();
    }
};

module.exports = { rateLimitSubmission };
