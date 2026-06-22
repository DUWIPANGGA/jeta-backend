import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { existsSync, mkdirSync } from 'fs';

const logDir = 'logs';
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, stack }) => {
          const ctx = context ? `[${context}]` : '';
          return `${timestamp} ${level} ${ctx} ${stack || message}`;
        }),
      ),
    }),

    new winston.transports.File({
      filename: `${logDir}/error.log`,
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),

    new winston.transports.File({
      filename: `${logDir}/combined.log`,
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
    }),
  ],
};

export const winstonLogger = WinstonModule.createLogger(winstonConfig);
