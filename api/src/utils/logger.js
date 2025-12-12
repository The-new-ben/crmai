// ============================================
// PROJECT ZERO-TOUCH - LOGGER
// Winston-based logging utility
// ============================================

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
});

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    defaultMeta: { service: 'zero-touch' },
    transports: [
        // Console transport (colorized in development)
        new winston.transports.Console({
            format: combine(
                colorize({ all: process.env.NODE_ENV !== 'production' }),
                logFormat
            )
        }),

        // File transport for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Create logs directory if running locally
if (process.env.NODE_ENV !== 'production') {
    import('fs').then(fs => {
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
    });
}

export default logger;
