import axios from '../utils/axios';

export interface GitHubLabel {
  id?: number; // Keep optional if not always present from backend
  node_id?: string;
  url?: string;
  name: string;
  color: string;
  default?: boolean;
  description?: string | null;
}

export interface GitHubComment {
  id?: number; // Keep optional if not always present from backend
  node_id?: string;
  url?: string;
  html_url?: string;
  issue_url?: string;
  user: {
    login: string;
    id?: number;
    node_id?: string;
    avatar_url?: string;
    gravatar_id?: string;
    url?: string;
    html_url?: string;
    // ... other user fields if needed
    type?: string;
    site_admin?: boolean;
  };
  created_at: string;
  updated_at?: string;
  author_association?: string;
  body: string;
  reactions?: {
    url?: string;
    total_count?: number;
    '+1'?: number;
    '-1'?: number;
    laugh?: number;
    hooray?: number;
    confused?: number;
    heart?: number;
    rocket?: number;
    eyes?: number;
  };
  performed_via_github_app?: null | any; // Adjust type if needed
}

export interface GitHubIssue {
  id: string; // This seems to be the internal DB ID
  githubId: number; // Matches 'id' field in JSON
  number: number;
  title: string;
  body: string;
  state: string; // 'open' or 'closed'
  priority?: string; // Keep if used elsewhere, not in JSON
  type?: string; // Keep if used elsewhere, maybe maps to label 'bug'/'suggestion'
  labels: GitHubLabel[]; // Updated type
  createdAt: string; // Matches 'created_at'
  updatedAt: string; // Matches 'updated_at'
  closedAt?: string | null; // Matches 'closed_at'
  userName?: string; // Could potentially map from 'user.login' if needed directly
  userEmail?: string; // Not in provided JSON
  assignee?: string | null | { login: string }; // JSON provides null or object, type allows string too? Adapt as needed.
  repository: string; // Might map from repository_url or context
  url: string; // Matches 'html_url'
  userAvatar?: string; // Can map from 'user.avatar_url'
  department?: string; // Keep if used elsewhere
  meldingId?: string; // Keep if used elsewhere
  comments: GitHubComment[]; // Updated type
  metadata?: any; // Keep if used elsewhere

  // Add other potentially useful fields from JSON if required:
  user?: GitHubComment['user']; // Include the main issue user object
  closed_by?: GitHubComment['user'] | null;
  state_reason?: string | null;
}

export interface IssueFilters {
  state?: string;
  priority?: string;
  type?: string;
  department?: string;
  labels?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IssueResponse {
  data: GitHubIssue[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}
export async function GetIssues(filters: IssueFilters): Promise<IssueResponse> {
  const response = await axios.get('/github/issues', { params: filters });
  return response.data;
}

export async function GetMyIssues(state: string = 'open'): Promise<GitHubIssue[]> {
  const response = await axios.get('/github/issues/me', { params: { state } });
  return response.data;
}

export interface IssueStatsResponse {
  data: {
    total: number;
    open: number;
    closed: number;
    byLabel: Record<string, number>;
    byUser: Record<string, number>;
  };
}
export async function GetIssueStats(): Promise<IssueStatsResponse> {
  const response = await axios.get('/github/issues/stats');
  return response.data;
}

export async function GetIssueById(id: string): Promise<GitHubIssue> {
  const response = await axios.get(`/github/issues/${id}`);
  return response.data;
}

export async function GetAllIssues(): Promise<GitHubIssue[]> {
  const response = await axios.get('/github/issues/all');
  return response.data;
}

export async function UpdateIssueStatus(
  id: string,
  status: 'open' | 'closed',
  options?: { reason?: string; comment?: string }
): Promise<GitHubIssue> {
  const response = await axios.put(`/github/issues/${id}/status`, { status, ...options });
  return response.data;
}

export async function CreateGithubIssue(data: Partial<GitHubIssue>): Promise<GitHubIssue> {
  const response = await axios.post('/github/issues', data);
  return response.data;
}

export async function AddCommentToIssue(issueId: string, commentBody: string): Promise<GitHubComment> {
  const response = await axios.post(`/github/issues/${issueId}/comments`, { comment: commentBody });
  return response.data;
}
