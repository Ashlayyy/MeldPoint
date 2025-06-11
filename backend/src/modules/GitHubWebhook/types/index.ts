export type GitHubEvent = 'issues' | 'push' | 'pull_request';

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

export interface IssueWebhookPayload {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'labeled' | 'unlabeled';
  issue: GitHubIssue;
  repository: {
    full_name: string;
    html_url: string;
  };
  sender: GitHubUser;
}

export interface WebhookResponse {
  message: string;
}
