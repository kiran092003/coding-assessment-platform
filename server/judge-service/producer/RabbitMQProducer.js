const amqp = require("amqplib");
const { createLogger } = require("../../shared/logger/logger");

const logger = createLogger("judge-service");

let channel;
let connected = false;
const getRabbitMQProducerStatus = () => connected;

const connectScoredProducer = async () => {
    const connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672"
    );
    channel = await connection.createChannel();
    await channel.assertQueue("submission_scored", { durable: true });
    connected = true;
    logger.info("RabbitMQ scored-event producer connected");

    connection.on("close", () => { connected = false; });
    connection.on("error", (err) => {
        connected = false;
        logger.error("RabbitMQ producer error", { error: err.message });
    });
};

const publishScoredEvent = async (data) => {
    if (!channel) return;
    channel.sendToQueue(
        "submission_scored",
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
    );
    logger.info("Scored event published", {
        contestId: data.contestId,
        userId: data.userId,
        questionId: data.questionId,
        passed: `${data.passedTestCases}/${data.totalTestCases}`,
    });
};

module.exports = { connectScoredProducer, publishScoredEvent, getRabbitMQProducerStatus };
