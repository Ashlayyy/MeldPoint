/* eslint-disable class-methods-use-this */
import axios from 'axios';
import prisma from '../db/prismaClient';
import config from '../config';
import logger from '../helpers/loggerInstance';

interface CreateIssueParams {
  title: string;
  body: string;
  labels: string[];
}

export default class GitHubService {
  private static instance: any | null = null;

  private readonly owner: string;

  private readonly repo: string;

  private constructor() {
    if (!config.github.apiKey) {
      throw new Error('GitHub API key is required');
    }

    const repoString = config.github.repo;
    if (!repoString || !repoString.includes('/')) {
      throw new Error('Invalid repository format in config. Expected "owner/repo"');
    }

    const [owner, repo] = repoString.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository format. Both owner and repo name are required');
    }

    this.owner = owner;
    this.repo = repo;
  }

  private async makeGitHubRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH', data?: any) {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/${endpoint}`;
    const headers = {
      Authorization: `token ${config.github.apiKey}`,
      Accept: 'application/vnd.github.v3+json'
    };

    try {
      const response = await axios({
        method,
        url,
        headers,
        data
      });
      return response.data;
    } catch (error: any) {
      logger.error(`GitHub API request failed: ${error.message}`);
      throw new Error(`GitHub API request failed: ${error.message}`);
    }
  }

  public static async getInstance(): Promise<GitHubService> {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  async createIssue({ title, body, labels }: CreateIssueParams) {
    try {
      const data = await this.makeGitHubRequest('issues', 'POST', { title, body, labels });

      await prisma.gitHubIssue.create({
        data: {
          githubId: String(data.id),
          number: data.number,
          title: data.title,
          body: data.body || '',
          state: data.state,
          labels: data.labels.map((label: any) => label.name),
          userName: data.user?.login,
          assignee: data.assignee?.login,
          repository: `${this.owner}/${this.repo}`,
          url: data.html_url
        }
      });

      return data;
    } catch (error: any) {
      logger.error(`GitHubService: Failed to create GitHub issue - ${error.message}`);
      throw new Error(`Failed to create GitHub issue: ${error.message}`);
    }
  }

  async updateIssueStatus(
    status: 'open' | 'closed',
    id: {
      githubId?: string;
      dbID?: string;
    },
    options?: {
      reason?: string;
      comment?: string;
    }
  ) {
    try {
      let issue;
      if (id?.githubId) {
        issue = await prisma.gitHubIssue.findUnique({
          where: { githubId: id.githubId }
        });
      } else if (id?.dbID) {
        issue = await prisma.gitHubIssue.findUnique({
          where: { id: id.dbID }
        });
      }

      if (!issue) {
        logger.error('GitHubService: Issue not found');
        throw new Error('Issue not found');
      }

      try {
        if (options?.comment) {
          await this.makeGitHubRequest(`issues/${issue.number}/comments`, 'POST', { body: options.comment });
        }

        await this.makeGitHubRequest(`issues/${issue.number}`, 'PATCH', { state: status });
      } catch (error: any) {
        logger.error(`GitHubService: GitHub API error - ${error.message}`);
        throw new Error(`Failed to update GitHub issue: ${error.message}`);
      }

      let whereClause: any;
      if (id?.githubId) {
        whereClause = { githubId: id.githubId };
      } else if (id?.dbID) {
        whereClause = { id: id.dbID };
      }
      return await prisma.gitHubIssue.update({
        where: whereClause,
        data: {
          state: status,
          closedAt: status === 'closed' ? new Date() : null,
          metadata: {
            closeReason: options?.reason,
            lastComment: options?.comment
          }
        }
      });
    } catch (error: any) {
      logger.error(`GitHubService: Failed to update issue status - ${error.message}`);
      throw error;
    }
  }

  async getIssueComments(issueNumber: number) {
    try {
      const data = await this.makeGitHubRequest(`issues/${issueNumber}/comments`, 'GET');

      return data;
    } catch (error: any) {
      logger.error(`GitHubService: Failed to fetch issue comments - ${error.message}`);
      throw new Error(`Failed to fetch issue comments: ${error.message}`);
    }
  }
}
