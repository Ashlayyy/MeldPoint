import { Octokit } from '@octokit/rest';
import { ParsedQs } from 'qs';
import logger from '../../utils/logger';

class GitHubService {
  private octokit: Octokit;

  private owner: string;

  private repo: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_API_KEY
    });
    this.owner = process.env.GITHUB_USERNAME || '';
    const repoValue = process.env.GITHUB_REPO || '';
    this.repo = repoValue.includes('/') ? repoValue.split('/')[1] : repoValue;
  }

  async createIssue(data: { title: string; body: string; labels?: string[] }) {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: data.title,
        body: data.body,
        labels: data.labels
      });

      return response.data;
    } catch (error) {
      logger.error('GitHubService: Failed to create issue:', error);
      throw error;
    }
  }

  async getIssues(query: ParsedQs) {
    try {
      const { state, labels, sort, direction } = query;
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: (state as 'open' | 'closed' | 'all') || 'open',
        labels: labels as string,
        sort: sort as 'created' | 'updated' | 'comments',
        direction: direction as 'asc' | 'desc'
      });

      return response.data;
    } catch (error) {
      logger.error('GitHubService: Failed to fetch issues:', error);
      throw error;
    }
  }

  async getIssue(issueNumber: number) {
    try {
      const response = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber
      });

      return response.data;
    } catch (error) {
      logger.error(`GitHubService: Failed to fetch issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async updateIssue(
    issueNumber: number,
    data: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[] }
  ) {
    try {
      const response = await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...data
      });

      return response.data;
    } catch (error) {
      logger.error(`GitHubService: Failed to update issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async closeIssue(issueNumber: number) {
    try {
      const response = await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        state: 'closed'
      });

      return response.data;
    } catch (error) {
      logger.error(`GitHubService: Failed to close issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async addComment(issueNumber: number, comment: string) {
    try {
      const response = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: comment
      });

      return response.data;
    } catch (error) {
      logger.error(`GitHubService: Failed to add comment to issue #${issueNumber}:`, error);
      throw error;
    }
  }
}

export default new GitHubService();
