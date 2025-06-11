import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../helpers/loggerInstance';

export default async function CheckAPIkey(req: Request, res: Response, next: NextFunction) {
  if (!process.env.API_KEY || process.env.API_KEY === '' || process.env.API_KEY === null) {
    res.status(401).send({
      error: 'Unauthorized',
      message: 'API key is not set'
    });

    logger.error('API key is not set');
  }
  if (req.headers['x-api-key']) {
    const hashedKey = crypto
      .createHash('sha256')
      .update(process.env.API_KEY as string)
      .digest('hex');
    if (hashedKey === req.headers['x-api-key']) {
      next();
    }
  } else if (req.query.apiKey) {
    const hashedKey = atob(req.query.apiKey as string);
    if (hashedKey === process.env.API_KEY) {
      next();
    }
  } else {
    res.status(401).send({
      error: 'Unauthorized',
      message: 'API key is not valid'
    });

    logger.error('API key is not valid');
  }
}
