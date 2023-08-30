import pad = require("@stdlib/string-pad");
import * as winston from "winston";
import {Logger} from "winston";

const savedBreadLength: number[] = [];
const padOpts = {
  'lpad': ' ',
  'rpad': ' ',
};

function _refactorMessage(info: winston.Logform.TransformableInfo) {
  const {target, message, breads, timestamp} = info;

  const albs = [] as string[];
  if (target) {
    albs.push(target);
  }
  if (breads && breads.length) {
    albs.push(...breads);
  }

  const parts = [] as string[];

  for (let i = 0; i < albs.length; i++) {
    const bread = albs[i];
    const breadLen = bread.length;
    const needLen = (i + 1) > savedBreadLength.length
      ? breadLen
      : (breadLen > savedBreadLength[i] ? breadLen : savedBreadLength[i]);
    const breadText = pad(bread, needLen, padOpts);
    parts.push(breadText);
    savedBreadLength[i] = needLen;
  }

  const breadString = parts.join('] [');
  return `${timestamp} | ` + (breadString ? `[${breadString}] ` : '') + message;
}

const customFormat = winston.format((info, opt) => {
//  console.log(info);
//  info.message = info.message + ' | ' + info.message;
  info.message = _refactorMessage(info);
  if (info.stack) {
    info.message += `\n${info.stack}`;
  }
  return info
});

export const logger: Logger = winston.createLogger({
  level: process.env.ORMPIPE_LOG_LEVEL ?? 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.errors({stack: true}),
        winston.format.colorize(),
        winston.format.splat(),
        winston.format.timestamp({format: 'YYYY-MM-DD[T]hh:mm:ss[Z]'}),
        customFormat(),
        winston.format.cli(),
      ),
    }),
  ]
});
