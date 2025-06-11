/* eslint-disable class-methods-use-this */
import logger from '../helpers/loggerInstance';

class Logger {
  private static instance: any;

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public error(message: string, context?: unknown): void {
    if (context) {
      logger.error(`${message}: ${JSON.stringify(context)}`);
    } else {
      logger.error(message);
    }
  }

  public info(message: string, context?: unknown): void {
    if (context) {
      logger.info(`${message}: ${JSON.stringify(context)}`);
    } else {
      logger.info(message);
    }
  }

  public warn(message: string, context?: unknown): void {
    if (context) {
      logger.warn(`${message}: ${JSON.stringify(context)}`);
    } else {
      logger.warn(message);
    }
  }

  public debug(message: string, context?: unknown): void {
    if (context) {
      logger.debug(`${message}: ${JSON.stringify(context)}`);
    } else {
      logger.debug(message);
    }
  }
}

export default Logger.getInstance();
