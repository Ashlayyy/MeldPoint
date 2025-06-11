import { Request, Response, NextFunction } from 'express';
import logger from '../helpers/loggerInstance';

export default function HandleError(error: any, _req: Request, res: Response, next: NextFunction) {
  if (error instanceof SyntaxError) {
    logger.error(`HandleError-Middleware: Syntax Error`);
    res.status(400).send({ error: 'Syntax Error' });
  } else if (error instanceof Error) {
    logger.error(`HandleError-Middleware: An error has occurred - ${error}`);
    res.status(500).send({
      error: 'An error has occurred, check logs for more details'
    });
  } else {
    logger.error(`HandleError-Middleware: An unknown error has occurred - ${error}`);
    res.status(500).send({
      error: 'An unknown error has occurred, check logs for more details'
    });
  }
}
