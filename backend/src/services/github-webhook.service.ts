/* eslint-disable class-methods-use-this */
import { Request } from 'express';
import prisma from '../db/prismaClient';
import { sendTemplatedEmail } from '../modules/Email/service/EmailService';
import logger from '../helpers/loggerInstance';
import GitHubService from './github.service';
import GitHubIssueTrackerService from './github-issue-tracker.service';

let githubService: GitHubService;
const issueTrackerService = GitHubIssueTrackerService.getInstance();

GitHubService.getInstance().then((instance) => {
  githubService = instance;
});

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  body: string;
  labels: Array<{ name: string }>;
  closed_at: string | null;
  user: {
    login: string;
    email?: string;
  };
  assignee?: {
    login: string;
    email?: string;
  };
  comments_url?: string;
}

interface IssueWebhookPayload {
  action: string;
  issue: GitHubIssue;
  repository: {
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
  };
}

export default class GitHubWebhookService {
  private static instance: any;

  public static getInstance(): GitHubWebhookService {
    if (!GitHubWebhookService.instance) {
      GitHubWebhookService.instance = new GitHubWebhookService();
    }
    return GitHubWebhookService.instance;
  }

  private parseIssueContent(body: string): {
    userName?: string;
    userEmail?: string;
    url?: string;
    subject?: string;
  } {
    const result: {
      userName?: string;
      userEmail?: string;
      url?: string;
      subject?: string;
    } = {};

    if (!body) {
      logger.info('Issue body is empty or undefined');
      return result;
    }

    // Normalize line endings
    const normalizedBody = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    logger.info(`Parsing issue content: ${normalizedBody}`);

    // Extract name - handle both markdown and plain text formats
    const nameMatch = normalizedBody.match(/\*\*Melder\*\*:\s*([^\n]+)/);
    if (nameMatch) {
      result.userName = nameMatch[1].trim();
      logger.info(`Found name: ${result.userName}`);
    } else {
      logger.info('No name match found. Regex used: /\\*\\*Melder\\*\\*:\\s*([^\\n]+)/');
    }

    // Extract email - handle both markdown and plain text formats
    const emailMatch = normalizedBody.match(/\*\*Email\*\*:\s*([^\n]+)/);
    if (emailMatch) {
      const rawEmail = emailMatch[1].trim();
      result.userEmail = rawEmail.replace(/[<>]/g, '').trim();
      logger.info(`Found email: ${result.userEmail}`);
    } else {
      logger.info(`No email match found in body`);
      logger.info(
        `Content around '**Email**:': ${
          normalizedBody.includes('**Email**:')
            ? normalizedBody.substring(
                normalizedBody.indexOf('**Email**:') - 10,
                normalizedBody.indexOf('**Email**:') + 50
              )
            : 'Email: not found'
        }`
      );
    }

    return result;
  }

  async handleIssueWebhook(payload: IssueWebhookPayload, req: Request) {
    try {
      if (payload.action === 'opened') {
        const existingIssues = await prisma.gitHubIssue.findMany({
          where: { githubId: String(payload.issue.id) },
          take: 1
        });

        if (existingIssues.length === 0) {
          const parsedContent = this.parseIssueContent(payload.issue.body);
          await issueTrackerService.createIssueRecord({
            githubId: String(payload.issue.id),
            number: payload.issue.number,
            title: payload.issue.title,
            body: payload.issue.body,
            state: payload.issue.state,
            labels: payload.issue.labels.map((label) => label.name),
            userName: payload.issue.user.login,
            userEmail: parsedContent.userEmail,
            assignee: payload.issue.assignee?.login,
            repository: payload.repository.full_name,
            url: `${payload.repository.html_url}/issues/${payload.issue.number}`
          });
          logger.info(`GitHubWebhookService: Created database record for issue #${payload.issue.number}`);
        }
      }

      // Update issue status in our database
      await githubService.updateIssueStatus(
        payload.issue.state as 'open' | 'closed',
        {
          githubId: String(payload.issue.id)
        },
        payload.issue.closed_at ? { reason: 'Closed by GitHub' } : undefined
      );

      // If the issue is closed, send email notifications
      if (payload.action === 'closed') {
        logger.info(`Processing closed action for issue #${payload.issue.number}`);

        // Parse the issue content
        const parsedContent = this.parseIssueContent(payload.issue.body);
        logger.info(`Parsed content from issue: ${JSON.stringify(parsedContent)}`);

        // Fetch comments for the issue
        let solution = 'Geen oplossing gevonden';
        if (payload.issue.comments_url) {
          const comments = await githubService.getIssueComments(payload.issue.number);
          if (comments && comments.length > 0) {
            solution = comments[comments.length - 1].body?.replace(/\n/g, '<br>') || 'Geen oplossing opgegeven.';
          }
          logger.info(`Found solution: ${solution}`);
        }

        // Prepare email data
        const emailData = {
          subject: `Feedback afgerond - ${payload.issue.title}`,
          ticketSubject: payload.issue.title,
          ticketNumber: `#${payload.issue.number}`,
          status: payload.issue.state === 'closed' ? 'Afgesloten' : 'Open',
          solution,
          issueUrl: `${payload.repository.html_url}/issues/${payload.issue.number}`,
          repoName: payload.repository.full_name
        };

        const isDev = process.env.NODE_ENV === 'development';
        const enableDevEmail = process.env.ENABLE_DEV_EMAIL === 'true';
        const devEmail = process.env.DEV_EMAIL || 'intalligence@intal.nl';
        const isDevMode = isDev || enableDevEmail;

        // Send to the email from the issue content
        if (parsedContent.userEmail) {
          const targetEmail = isDevMode ? devEmail : parsedContent.userEmail;
          logger.info(`Attempting to send email to user: ${isDevMode ? devEmail : parsedContent.userEmail}`);
          try {
            await sendTemplatedEmail(req, targetEmail, 'helpdesk-afgesloten', {
              ...emailData,
              userName: parsedContent.userName
            });
            logger.info(`Successfully sent email to user: ${isDevMode ? devEmail : parsedContent.userEmail}`);
          } catch (emailError) {
            logger.error(`Failed to send email to user: ${emailError}`);
          }
        } else {
          logger.warn(`No user email found in issue content for issue #${payload.issue.number}`);
        }

        if (payload.issue.assignee?.email && payload.issue.assignee.email !== parsedContent.userEmail) {
          const targetEmail = isDevMode ? devEmail : payload.issue.assignee.email;
          logger.info(`Attempting to send email to assignee: ${isDevMode ? devEmail : payload.issue.assignee.email}`);
          try {
            await sendTemplatedEmail(req, targetEmail, 'helpdesk-afgesloten', {
              ...emailData,
              userName: parsedContent.userName
            });
            logger.info(`Successfully sent email to assignee: ${isDevMode ? devEmail : payload.issue.assignee.email}`);
          } catch (emailError) {
            logger.error(`Failed to send email to assignee: ${emailError}`);
          }
        } else {
          logger.warn(`No assignee email found for issue #${payload.issue.number}`);
        }
      }
    } catch (error) {
      logger.error(`GitHubWebhookService: Failed to process webhook - ${error}`);
      throw new Error('Failed to process webhook');
    }
  }
}
