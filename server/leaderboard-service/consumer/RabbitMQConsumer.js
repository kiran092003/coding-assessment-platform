const amqp = require("amqplib");
const leaderboardService = require("../services/LeaderboardService");
const { createLogger } = require("../../shared/logger/logger");

const logger = createLogger("leaderboard-service");

let connected = false;
const getRabbitMQStatus = () => connected;

const consumeScoredSubmissions = async () => {
    try {
        const connection = await amqp.connect(
            process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672"
        );

        connected = true;
        logger.info("RabbitMQ consumer connected");

        connection.on("close", () => {
            connected = false;
            logger.warn("RabbitMQ consumer connection closed");
        });
        connection.on("error", (err) => {
            connected = false;
            logger.error("RabbitMQ consumer error", { error: err.message });
        });

        const channel = await connection.createChannel();
        await channel.assertQueue("submission_scored", { durable: true });
        channel.prefetch(1);

        logger.info("Waiting for scored submissions");

        channel.consume(
            "submission_scored",
            async (msg) => {
                if (!msg) return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    logger.info("Scored event consumed", {
                        contestId: data.contestId,
                        userId: data.userId,
                        questionId: data.questionId,
                        passed: `${data.passedTestCases}/${data.totalTestCases}`,
                    });

                    await leaderboardService.handleScoredSubmission(data);
                    channel.ack(msg);
                } catch (error) {
                    logger.error("Error processing scored event", { error: error.message });
                    channel.nack(msg, false, false);
                }
            },
            { noAck: false }
        );
    } catch (error) {
        connected = false;
        logger.error("RabbitMQ consumer startup failed", { error: error.message });
    }
};

module.exports = { consumeScoredSubmissions, getRabbitMQStatus };
