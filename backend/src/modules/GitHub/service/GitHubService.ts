import { Octokit } from '@octokit/rest';
import config from '../../../config';
import logger from '../../../helpers/loggerInstance';
import {
  GitHubIssue,
  IssueComment,
  IssueStats,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueStatusUpdate,
  AddCommentPayload,
  GitHubResponse,
  IssueState,
  GitHubRelease
} from '../types';

if (!config.github?.apiKey || !config.github?.username || !config.github?.repo || !config.github?.repoFull) {
  throw new Error('Missing required GitHub configuration');
}

const octokit = new Octokit({
  auth: config.github.apiKey,
  baseUrl: 'https://api.github.com',
  log: {
    debug: (message) => {
      logger.debug(`GitHubService: DEBUG - ${message}`);
    },
    info: (message) => {
      logger.info(`GitHubService: INFO - ${message}`);
    },
    warn: (message) => {
      logger.warn(`GitHubService: WARN - ${message}`);
    },
    error: (message) => {
      logger.error(`GitHubService: ERROR - ${message}`);
    }
  }
});

const handleGitHubResponse = async <T>(promise: Promise<any>): Promise<GitHubResponse<T>> => {
  try {
    const response = await promise;
    return {
      data: response.data,
      meta: {
        rateLimit: {
          limit: parseInt(response.headers['x-ratelimit-limit'] || '0', 10),
          remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0', 10),
          reset: parseInt(response.headers['x-ratelimit-reset'] || '0', 10)
        }
      }
    };
  } catch (error) {
    logger.error(`GitHubService: API call failed - ${error}`);
    throw error;
  }
};

// Helper function to escape regex special characters
const escapeRegex = (str: string): string => {
  // Escape characters with special meaning in regex: . * + ? ^ $ { } ( ) | [ ] \
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const createIssue = async (payload: CreateIssuePayload): Promise<GitHubResponse<GitHubIssue>> => {
  logger.info('GitHubService: Creating new issue', { title: payload.title });
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');
  return handleGitHubResponse(
    octokit.issues.create({
      owner,
      repo,
      ...payload
    })
  );
};

// Define an interface for the parameters
interface GetIssuesParams {
  state: IssueState;
  page: number;
  per_page: number;
  sort: 'created' | 'updated' | 'comments';
  direction: 'asc' | 'desc';
  labels?: string;
}

export const getIssues = async ({
  state,
  page,
  per_page,
  sort,
  direction,
  labels
}: GetIssuesParams): Promise<GitHubResponse<GitHubIssue[]>> => {
  logger.info(`GitHubService: Fetching issues with params:`, { state, page, per_page, sort, direction, labels });
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');

  const requestParams: any = {
    owner,
    repo,
    state,
    page,
    per_page,
    sort,
    direction
  };

  if (labels) {
    requestParams.labels = labels;
  }

  return handleGitHubResponse(octokit.issues.listForRepo(requestParams));
};

export const getIssue = async (issueNumber: number): Promise<GitHubResponse<GitHubIssue>> => {
  logger.info(`GitHubService: Fetching issue #${issueNumber}`);
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');
  return handleGitHubResponse(
    octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    })
  );
};

export const updateIssue = async (
  issueNumber: number,
  payload: UpdateIssuePayload & { state?: IssueState }
): Promise<GitHubResponse<GitHubIssue>> => {
  logger.info(`GitHubService: Updating issue #${issueNumber}`);
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');
  return handleGitHubResponse(
    octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...payload
    })
  );
};

export const closeIssue = async (issueNumber: number): Promise<GitHubResponse<GitHubIssue>> => {
  logger.info(`GitHubService: Closing issue #${issueNumber}`);
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');
  return handleGitHubResponse(
    octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: 'closed'
    })
  );
};

export const addComment = async (
  issueNumber: number,
  payload: AddCommentPayload
): Promise<GitHubResponse<IssueComment>> => {
  logger.info(`GitHubService: Adding comment to issue #${issueNumber}`);
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');
  return handleGitHubResponse(
    octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: payload.comment
    })
  );
};

// New function to find issues by email in the body
export const findByEmail = async (email: string): Promise<GitHubIssue[]> => {
  logger.info(`GitHubService: Searching for issues containing email: ${email}`);
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration for repoFull');
  }
  const [owner, repo] = config.github.repoFull.split('/');

  const allIssues = await getAllIssuesPaginated();
  const escapedEmail = escapeRegex(email);
  const emailRegex = new RegExp(`\\*\\*Email\\*\\*:\\s+${escapedEmail}`, 'i');

  const filteredIssues = allIssues.filter((issue) => {
    return issue.body && emailRegex.test(issue.body);
  });

  logger.info(`GitHubService: Found ${filteredIssues.length} issues matching email ${email}. Fetching comments.`);

  if (filteredIssues.length === 0) {
    return []; // No issues found, return early
  }

  // Fetch comments concurrently for filtered issues
  const issuesWithComments = await Promise.all(
    filteredIssues.map(async (issue) => {
      try {
        const commentsResponse = await handleGitHubResponse<IssueComment[]>(
          octokit.issues.listComments({
            owner,
            repo,
            issue_number: issue.number,
            per_page: 100 // Fetch up to 100 comments
          })
        );
        logger.debug(
          `GitHubService: Successfully fetched ${commentsResponse.data.length} comments for issue #${issue.number}`
        );
        return { ...issue, comments: commentsResponse.data };
      } catch (error) {
        logger.warn(
          `GitHubService: Failed to fetch comments for issue #${issue.number} - ${error instanceof Error ? error.message : String(error)}. Returning issue without comments.`
        );
        return { ...issue }; // Return the original issue object without comments field if fetching fails
      }
    })
  );

  logger.info(`GitHubService: Finished processing issues with comments for email ${email}`);
  return issuesWithComments;
};

export const getMyIssues = async (email: string): Promise<GitHubIssue[]> => {
  logger.info(`GitHubService: Finding issues by email in body for: ${email}`);
  return findByEmail(email);
};

// New function to fetch all issues using pagination
export const getAllIssuesPaginated = async (): Promise<GitHubIssue[]> => {
  logger.info('GitHubService: Fetching all issues with pagination');
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');

  try {
    const issues = await octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: 'all',
      per_page: 500
    });
    logger.info(`GitHubService: Fetched a total of ${issues.length} issues.`);
    return issues as unknown as GitHubIssue[];
  } catch (error) {
    logger.error(`GitHubService: Failed to fetch paginated issues - ${error}`);
    throw error;
  }
};

export const getIssueStats = async (): Promise<GitHubResponse<IssueStats>> => {
  logger.info('GitHubService: Calculating issue statistics');
  const issues = await getAllIssuesPaginated();

  const stats: IssueStats = {
    total: issues.length,
    open: issues.filter((issue) => issue.state === 'open').length,
    closed: issues.filter((issue) => issue.state === 'closed').length,
    byLabel: {} as Record<string, number>,
    byUser: {}
  };

  issues.forEach((issue) => {
    // Count by label
    issue.labels.forEach((label) => {
      if (label && typeof label === 'object' && label.name) {
        stats.byLabel[label.name] = (stats.byLabel[label.name] || 0) + 1;
      } else {
        logger.warn(
          `GitHubService: Encountered unexpected label structure in issue #${issue.number}: ${JSON.stringify(label)}`
        );
      }
    });

    const username = issue.user.login;
    stats.byUser[username] = (stats.byUser[username] || 0) + 1;
  });
  return { data: stats };
};

export const updateIssueStatus = async (
  issueNumber: number,
  { status, reason, comment }: IssueStatusUpdate
): Promise<GitHubResponse<GitHubIssue>> => {
  logger.info(`GitHubService: Updating status of issue #${issueNumber} to ${status}`);

  const promises: Promise<any>[] = [updateIssue(issueNumber, { state: status })];

  if (comment) {
    promises.push(addComment(issueNumber, { comment: `Status changed to ${status}${reason ? `: ${reason}` : ''}` }));
  }

  const [issueResponse] = await Promise.all(promises);
  return issueResponse;
};

export const getReleases = async (): Promise<GitHubResponse<GitHubRelease[]>> => {
  logger.info('GitHubService: Fetching all releases');
  if (!config.github.repoFull) {
    throw new Error('Missing required GitHub configuration');
  }
  const [owner, repo] = config.github.repoFull.split('/');
  return handleGitHubResponse<GitHubRelease[]>(
    octokit.rest.repos.listReleases({
      owner,
      repo
    })
  );
};
