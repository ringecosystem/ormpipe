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

  const albs = [];
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
    const needLen = (i + 1) > savedBreadLength.length ? breadLen : savedBreadLength[i];
    parts.push(pad(bread, needLen, padOpts));
    savedBreadLength[i] = needLen;
  }

  const breadString = parts.join('] [');
  return `${timestamp} | ` + (breadString ? `[${breadString}] ` : '') + message;
}

const customFormat = winston.format((info, opt) => {
//  console.log(info);
//  info.message = info.message + ' | ' + info.message;
  info.message = _refactorMessage(info);
  return info
});

export const logger: Logger = winston.createLogger({
  level: process.env.ORMPIPE_LOG_LEVEL ?? 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp({format: 'YYYY-MM-DD[T]hh:mm:ss[Z]'}),
        customFormat(),
        winston.format.cli(),
      ),
    }),
  ]
});
