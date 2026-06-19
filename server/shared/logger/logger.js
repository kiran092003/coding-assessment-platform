const winston = require("winston");
const { combine, timestamp, printf, errors, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, service, ...meta }) => {
    const metaStr = Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ");
    const base = `${timestamp} ${level.toUpperCase()} [${service}] ${stack || message}`;
    return metaStr ? `${base} ${metaStr}` : base;
});

const createLogger = (service) =>
    winston.createLogger({
        level: process.env.LOG_LEVEL || "info",
        defaultMeta: { service },
        format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: true }),
            logFormat
        ),
        transports: [
            new winston.transports.Console({
                format: combine(
                    colorize({ message: true }),
                    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                    errors({ stack: true }),
                    logFormat
                )
            })
        ]
    });

module.exports = { createLogger };
