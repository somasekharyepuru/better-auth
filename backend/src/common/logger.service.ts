import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = process.env.LOG_DIR || 'logs';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
);

const consoleFormat = winston.format.combine(
    logFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        let msg = `${timestamp} [${level}]`;
        if (requestId) msg += ` [${requestId}]`;
        msg += `: ${message}`;

        // Properly serialize errors
        const serializedMeta = Object.keys(meta).reduce((acc, key) => {
            const value = meta[key];
            if (value instanceof Error) {
                acc[key] = {
                    message: value.message,
                    stack: value.stack,
                    name: value.name,
                    ...(value as any)
                };
            } else {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        if (Object.keys(serializedMeta).length > 0) {
            msg += ` ${JSON.stringify(serializedMeta)}`;
        }
        return msg;
    }),
);

const fileFormat = winston.format.combine(
    logFormat,
    winston.format.json(),
);

const transports: winston.transport[] = [];

if (!isTest) {
    transports.push(
        new winston.transports.Console({
            level: isDevelopment ? 'debug' : 'info',
            format: consoleFormat,
        }),
    );
}

if (!isDevelopment && !isTest) {
    const errorLogTransport = new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format: fileFormat,
    });

    const combinedLogTransport = new DailyRotateFile({
        dirname: logDir,
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    });

    const auditLogTransport = new DailyRotateFile({
        dirname: logDir,
        filename: 'audit-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info',
        format: fileFormat,
    });

    transports.push(errorLogTransport, combinedLogTransport, auditLogTransport);
}

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: fileFormat,
    transports,
    exitOnError: false,
});

export const createChildLogger = (context: string, meta: Record<string, any> = {}) => {
    return logger.child({ context, ...meta });
};

export const auditLogger = createChildLogger('audit');

export default logger;
