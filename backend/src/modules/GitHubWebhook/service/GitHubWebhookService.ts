import { Request } from 'express';
import logger from '../../../helpers/loggerInstance';
import { IssueWebhookPayload } from '../types';

const createMeldingFromIssue = async (issue: IssueWebhookPayload['issue']) => {
  // TODO: Implement melding creation from issue
  logger.info('GitHubWebhookService: Would create melding from issue', {
    issueNumber: issue.number,
    title: issue.title
  });
};

const updateMeldingFromIssue = async (issue: IssueWebhookPayload['issue']) => {
  // TODO: Implement melding update from issue
  logger.info('GitHubWebhookService: Would update melding from issue', {
    issueNumber: issue.number,
    title: issue.title
  });
};

const handleIssueWebhook = async (payload: IssueWebhookPayload, req: Request): Promise<void> => {
  try {
    logger.info(`GitHubWebhookService: Processing ${payload.action} action for issue #${payload.issue.number}`);
    logger.debug('GitHubWebhookService: Issue details', {
      title: payload.issue.title,
      state: payload.issue.state,
      repository: payload.repository.full_name
    });

    switch (payload.action) {
      case 'opened':
        await createMeldingFromIssue(payload.issue);
        break;
      case 'edited':
      case 'labeled':
      case 'unlabeled':
        await updateMeldingFromIssue(payload.issue);
        break;
      default:
        logger.warn(`GitHubWebhookService: Unhandled issue action: ${payload.action}`);
    }

    logger.info('GitHubWebhookService: Successfully processed issue webhook');
  } catch (error) {
    logger.error(`GitHubWebhookService: Failed to process issue webhook - ${error}`);
    throw error;
  }
};

export default handleIssueWebhook;
