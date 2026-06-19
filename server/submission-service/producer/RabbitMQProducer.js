const amqp = require("amqplib");
const { createLogger } = require("../../shared/logger/logger");

const logger = createLogger("submission-service");

let channel;
let connected = false;
const getRabbitMQStatus = () => connected;

const connectQueue = async () => {
    const connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672"
    );
    channel = await connection.createChannel();
    await channel.assertQueue("submission_queue", { durable: true });
    connected = true;
    logger.info("RabbitMQ producer connected");

    connection.on("close", () => { connected = false; });
    connection.on("error", (err) => {
        connected = false;
        logger.error("RabbitMQ producer error", { error: err.message });
    });
};

const publishSubmission = async (data) => {
    channel.sendToQueue(
        "submission_queue",
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
    );
    logger.info("Submission queued", {
        submissionId: data.submissionId,
        userId: data.userId,
        questionId: data.questionId,
        language: data.language,
    });
};

module.exports = { connectQueue, publishSubmission, getRabbitMQStatus };
