const redis = require("redis");

const client = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

client.on("error", (err) => console.error("Redis Error:", err));

const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
        console.log("Redis Connected");
    }
};

module.exports = { client, connectRedis };
