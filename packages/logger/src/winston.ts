import * as winston from "winston";
import {Logger} from "winston";


export const logger: Logger = winston.createLogger({
  level: process.env.ORMPIPE_LOG_LEVEL ?? 'debug',
  transports: [
    new winston.transports.Console(),
  ]
});
