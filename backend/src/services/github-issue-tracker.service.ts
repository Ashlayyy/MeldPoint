/* eslint-disable class-methods-use-this */
import prisma from '../db/prismaClient';
import logger from '../helpers/loggerInstance';

interface GitHubIssueData {
  githubId: string;
  number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  userName?: string | null;
  userEmail?: string | null;
  assignee?: string | null;
  repository: string;
  url: string;
  closedAt?: Date | null;
}

export default class GitHubIssueTrackerService {
  private static instance: any;

  public static getInstance(): GitHubIssueTrackerService {
    if (!GitHubIssueTrackerService.instance) {
      GitHubIssueTrackerService.instance = new GitHubIssueTrackerService();
    }
    return GitHubIssueTrackerService.instance;
  }

  async createIssueRecord(issueData: GitHubIssueData) {
    try {
      return await prisma.gitHubIssue.create({
        data: {
          githubId: String(issueData.githubId),
          number: issueData.number,
          title: issueData.title,
          body: issueData.body,
          state: issueData.state,
          labels: issueData.labels,
          userName: issueData.userName || null,
          userEmail: issueData.userEmail || null,
          assignee: issueData.assignee || null,
          repository: issueData.repository,
          url: issueData.url
        }
      });
    } catch (error) {
      logger.error(`GitHubIssueTrackerService: Failed to create issue record - ${error}`);
      throw new Error(`Failed to create issue record: ${error}`);
    }
  }

  async updateIssueStatus(issueNumber: number, status: string, closedAt?: Date) {
    try {
      return await prisma.gitHubIssue.update({
        where: { number: issueNumber },
        data: {
          state: status,
          closedAt: closedAt || null,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error(`GitHubIssueTrackerService: Failed to update issue status - ${error}`);
      throw new Error(`Failed to update issue status: ${error}`);
    }
  }

  async getIssueByNumber(issueNumber: number) {
    try {
      return await prisma.gitHubIssue.findUnique({
        where: { number: issueNumber }
      });
    } catch (error) {
      logger.error(`GitHubIssueTrackerService: Failed to get issue - ${error}`);
      throw new Error(`Failed to get issue: ${error}`);
    }
  }

  async getAllIssues() {
    try {
      return await prisma.gitHubIssue.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error(`GitHubIssueTrackerService: Failed to get all issues - ${error}`);
      throw new Error(`Failed to get all issues: ${error}`);
    }
  }
}
