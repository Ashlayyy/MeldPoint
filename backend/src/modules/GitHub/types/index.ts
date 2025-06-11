import { RestEndpointMethodTypes } from '@octokit/rest';

export interface IssueLabel {
  id?: number;
  node_id?: string;
  url?: string;
  name: string;
  color?: string;
  default?: boolean;
  description?: string | null;
}

export type IssueState = 'open' | 'closed';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: (string | { name?: string })[];
  state: IssueState;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  comments?: IssueComment[];
}

export type IssueComment = RestEndpointMethodTypes['issues']['createComment']['response']['data'];

export interface IssueStats {
  total: number;
  open: number;
  closed: number;
  byLabel: Record<string, number>;
  byUser: Record<string, number>;
}

export interface CreateIssuePayload {
  title: string;
  body: string;
  labels: IssueLabel[];
}

export interface UpdateIssuePayload extends Partial<CreateIssuePayload> {}

export interface IssueStatusUpdate {
  status: IssueState;
  reason?: string;
  comment?: string;
}

export interface AddCommentPayload {
  comment: string;
}

export interface GitHubResponse<T> {
  data: T;
  meta?: {
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

// Added type definition for GitHub Release
export interface GitHubRelease {
  tag_name: string;
  published_at: string | null;
  body: string | null;
  html_url: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
}
