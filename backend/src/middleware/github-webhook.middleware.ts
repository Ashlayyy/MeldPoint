import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';
import logger from '../helpers/loggerInstance';

const validateGithubWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  if (!signature || !event) {
    logger.error(`Github-Webhook-Middleware: Missing required headers`);
    res.status(400).json({ error: 'Missing required headers' });
    return;
  }

  const hmac = crypto.createHmac('sha256', config.github.webhookSecret || '');
  const calculatedSignature = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

  if (calculatedSignature !== signature) {
    logger.error(`Github-Webhook-Middleware: Invalid signature`);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
};

export default validateGithubWebhook;
