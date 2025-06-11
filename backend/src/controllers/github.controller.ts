import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { logSuccess, logError } from '../middleware/handleHistory';
import handleError from '../utils/errorHandler';
import logger from '../utils/logger';
import config from '../config';
import prisma from '../db/prismaClient';
import GitHubService from '../services/github.service';
import { channelManager } from '../server';

let githubService: GitHubService;

GitHubService.getInstance()
  .then((instance) => {
    githubService = instance;
  })
  .catch((error) => {
    logger.error(`Failed to initialize GitHub service: ${error}`);
    process.exit(1);
  });

class GitHubController {
  private static octokit = new Octokit({
    auth: config.github.apiKey
  });

  private static calculateExecutionTime(startTime: [number, number]): number {
    return Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
  }

  public static async createIssue(req: Request, res: Response): Promise<void> {
    const startTime = process.hrtime();
    const { title, body, labels } = req.body;

    try {
      logger.info('GitHub-Controller: Creating new GitHub issue');
      const result = await this.octokit.issues.create({
        owner: config.github.username || '',
        repo: config.github.repo || '',
        title,
        body,
        labels
      });

      logSuccess(req, {
        action: 'CREATE_GITHUB_ISSUE',
        resourceType: 'GITHUB_ISSUE',
        resourceId: result.data.id.toString(),
        newState: result.data,
        changedFields: Object.keys(req.body),
        metadata: {
          executionTime: this.calculateExecutionTime(startTime),
          issueNumber: result.data.number,
          issueUrl: result.data.html_url
        }
      });

      logger.info(`GitHub-Controller: Successfully created issue #${result.data.number}`);
      res.status(201).json({
        data: {
          id: result.data.id,
          number: result.data.number,
          url: result.data.html_url
        }
      });
    } catch (error) {
      logger.error(`GitHub-Controller: Failed to create issue - ${error}`);
      logError(req, {
        action: 'CREATE_GITHUB_ISSUE',
        resourceType: 'GITHUB_ISSUE',
        error: error instanceof Error ? error : new Error('Unknown error')
      });

      handleError(error, res);
    }
  }

  // Get issues with filtering
  static async getIssues(req: Request, res: Response): Promise<Response> {
    try {
      const { state = 'all', priority, type, department, search, startDate, endDate, page = 1, limit = 10 } = req.query;

      const where: any = {};

      if (state !== 'all') where.state = state;
      if (priority) where.priority = priority;
      if (type) where.type = type;
      if (department) where.department = department;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { body: { contains: search as string, mode: 'insensitive' } }
        ];
      }
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [issues, total] = await Promise.all([
        prisma.gitHubIssue.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.gitHubIssue.count({ where })
      ]);

      return res.json({
        issues,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      logger.error(`Failed to fetch issues: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch issues' });
    }
  }

  // Get issues for current user
  static async getMyIssues(req: Request, res: Response): Promise<Response> {
    try {
      const { state = 'open' } = req.query;
      const issues = await prisma.gitHubIssue.findMany({
        where: {
          userEmail: req.user?.Email,
          state: state as string
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(issues);
    } catch (error) {
      logger.error(`Failed to fetch issues: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch your issues' });
    }
  }

  // Get issue statistics
  static async getIssueStats(req: Request, res: Response): Promise<Response> {
    try {
      const allissues = await prisma.gitHubIssue.findMany();
      const stats = await prisma.gitHubIssue.groupBy({
        by: ['state'],
        _count: true
      });
      return res.json(stats);
    } catch (error) {
      logger.error(`Failed to fetch issues: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch issue statistics' });
    }
  }

  // Get single issue by ID
  static async getIssueById(req: Request, res: Response): Promise<Response> {
    try {
      const issue = await prisma.gitHubIssue.findUnique({
        where: { id: req.params.id }
      });
      if (!issue) return res.status(404).json({ error: 'Issue not found' });
      return res.json(issue);
    } catch (error) {
      logger.error(`Failed to fetch issues: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch issue' });
    }
  }

  // Get all issues (admin only)
  static async getAllIssues(req: Request, res: Response): Promise<Response> {
    try {
      const issues = await prisma.gitHubIssue.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(issues);
    } catch (error) {
      logger.error(`Failed to fetch issues: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch all issues' });
    }
  }

  // Update issue status (admin only)
  static async updateIssueStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, reason, comment } = req.body;

      if (!['open', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updatedIssue = await githubService.updateIssueStatus(
        status as 'open' | 'closed',
        {
          dbID: id
        },
        {
          reason,
          comment
        }
      );

      const githubChannel = channelManager.getGitHubChannel();
      githubChannel?.emitIssueUpdated(updatedIssue);

      return res.json(updatedIssue);
    } catch (error) {
      logger.error(`Failed to update issue status: ${error}`);
      return res.status(500).json({ error: 'Failed to update issue status' });
    }
  }
}

export default GitHubController;
