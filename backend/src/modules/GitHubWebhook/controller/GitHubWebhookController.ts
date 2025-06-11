import { Request, Response } from 'express';
import logger from '../../../helpers/loggerInstance';
import handleIssueWebhook from '../service/GitHubWebhookService';
import { GitHubEvent, IssueWebhookPayload } from '../types';

const processWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.headers['x-github-event'] as GitHubEvent;
    logger.info(`GitHub-Webhook-Controller: Received ${event} event`);

    switch (event) {
      case 'issues': {
        const payload = req.body as IssueWebhookPayload;
        await handleIssueWebhook(payload, req);
        res.status(200).json({ message: 'Webhook processed successfully' });
        break;
      }
      case 'push':
      case 'pull_request':
        logger.warn(`GitHub-Webhook-Controller: Event type ${event} not yet implemented`);
        res.status(501).json({ error: 'Event type not yet implemented' });
        break;
      default:
        logger.warn(`GitHub-Webhook-Controller: Unsupported event type received: ${event}`);
        res.status(400).json({ error: 'Unsupported event type' });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`GitHub-Webhook-Controller: Failed to process webhook - ${err}`);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

export default processWebhook;
