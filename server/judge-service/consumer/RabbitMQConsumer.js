const amqp = require("amqplib");
const { judgeSubmission } = require("../services/JudgeService");
const { createLogger } = require("../../shared/logger/logger");

const logger = createLogger("judge-service");

let connected = false;
const getRabbitMQStatus = () => connected;

const consumeSubmissions = async () => {
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
            logger.error("RabbitMQ consumer connection error", { error: err.message });
        });

        const channel = await connection.createChannel();
        await channel.assertQueue("submission_queue", { durable: true });
        channel.prefetch(1);

        logger.info("Waiting for submissions");

        channel.consume(
            "submission_queue",
            async (msg) => {
                if (!msg) return;
                try {
                    const submission = JSON.parse(msg.content.toString());
                    logger.info("Submission consumed", {
                        submissionId: submission.submissionId,
                        userId: submission.userId,
                        questionId: submission.questionId,
                        language: submission.language,
                    });

                    await judgeSubmission(submission);
                    channel.ack(msg);
                } catch (error) {
                    logger.error("Error processing submission", { error: error.message });
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

module.exports = { consumeSubmissions, getRabbitMQStatus };
