import { Request, Response } from 'express';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';
import * as GitHubService from '../service/GitHubService';
import { CreateIssuePayload, UpdateIssuePayload, AddCommentPayload, IssueStatusUpdate, IssueState } from '../types';

const handleServiceError = async (req: Request, res: Response, error: Error, action: string) => {
  logger.error(`GitHub-Controller: ${action} failed - ${error}`);
  logError(req, {
    action,
    resourceType: 'GITHUB_ISSUE',
    error,
    metadata: { requestBody: req.body }
  });
  res.status(500).json({ error: error.message });
};

export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as CreateIssuePayload;
    const result = await GitHubService.createIssue(payload);

    logSuccess(req, {
      action: 'CREATE_GITHUB_ISSUE',
      resourceType: 'GITHUB_ISSUE',
      metadata: { issue: result }
    });

    res.status(201).json(result.data);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'CREATE_GITHUB_ISSUE'
    );
  }
};

export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters with defaults
    const state = (req.query.state as IssueState) || 'open';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const sortBy = (req.query.sortBy as string) || 'created';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const labels = req.query.labels as string; // Comma-separated string of labels

    // Map to Octokit parameter names
    const per_page = limit;
    const sort = ['created', 'updated', 'comments'].includes(sortBy)
      ? (sortBy as 'created' | 'updated' | 'comments')
      : 'created';
    const direction = ['asc', 'desc'].includes(sortOrder) ? (sortOrder as 'asc' | 'desc') : 'desc';

    // Validate state
    const validState = ['open', 'closed', 'all'].includes(state) ? state : 'open';

    const result = await GitHubService.getIssues({
      state: validState,
      page,
      per_page,
      sort,
      direction,
      labels // Pass labels to the service
    });
    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'GET_GITHUB_ISSUES'
    );
  }
};

export const getIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueNumber = parseInt(req.params.issueNumber, 10);
    if (Number.isNaN(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number' });
      return;
    }

    const result = await GitHubService.getIssue(issueNumber);
    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(req, res, error instanceof Error ? error : new Error('Unknown error'), 'GET_GITHUB_ISSUE');
  }
};

export const updateIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueNumber = parseInt(req.params.issueNumber, 10);
    if (Number.isNaN(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number' });
      return;
    }

    const payload = req.body as UpdateIssuePayload;
    const result = await GitHubService.updateIssue(issueNumber, payload);

    logSuccess(req, {
      action: 'UPDATE_GITHUB_ISSUE',
      resourceType: 'GITHUB_ISSUE',
      resourceId: issueNumber.toString(),
      metadata: { issue: result }
    });

    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'UPDATE_GITHUB_ISSUE'
    );
  }
};

export const closeIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueNumber = parseInt(req.params.issueNumber, 10);
    if (Number.isNaN(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number' });
      return;
    }

    const result = await GitHubService.closeIssue(issueNumber);

    logSuccess(req, {
      action: 'CLOSE_GITHUB_ISSUE',
      resourceType: 'GITHUB_ISSUE',
      resourceId: issueNumber.toString(),
      metadata: { issue: result }
    });

    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'CLOSE_GITHUB_ISSUE'
    );
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueNumber = parseInt(req.params.issueNumber, 10);
    if (Number.isNaN(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number' });
      return;
    }

    const payload = req.body as AddCommentPayload;
    const result = await GitHubService.addComment(issueNumber, payload);

    logSuccess(req, {
      action: 'ADD_GITHUB_COMMENT',
      resourceType: 'GITHUB_ISSUE',
      resourceId: issueNumber.toString(),
      metadata: { comment: result }
    });

    res.status(201).json(result);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'ADD_GITHUB_COMMENT'
    );
  }
};

export const getMyIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.Email;
    logger.debug(`GitHubController: getMyIssues, EMAIL =  ${userEmail}`);
    if (!userEmail) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    const result = await GitHubService.getMyIssues(userEmail);
    console.log(`GitHubController: getMyIssues, RESULT =  ${result}`);
    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'GET_MY_GITHUB_ISSUES'
    );
  }
};

export const getIssueStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await GitHubService.getIssueStats();
    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(
      _req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'GET_GITHUB_ISSUE_STATS'
    );
  }
};

export const updateIssueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueNumber = parseInt(req.params.issueNumber, 10);
    if (Number.isNaN(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number' });
      return;
    }

    const payload = req.body as IssueStatusUpdate;
    const result = await GitHubService.updateIssueStatus(issueNumber, payload);

    logSuccess(req, {
      action: 'UPDATE_GITHUB_ISSUE_STATUS',
      resourceType: 'GITHUB_ISSUE',
      resourceId: issueNumber.toString(),
      metadata: { issue: result, status: payload.status }
    });

    res.status(200).json(result);
  } catch (error) {
    await handleServiceError(
      req,
      res,
      error instanceof Error ? error : new Error('Unknown error'),
      'UPDATE_GITHUB_ISSUE_STATUS'
    );
  }
};
