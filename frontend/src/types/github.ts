export interface GitHubIssue {
  id: string;
  title: string;
  body: string;
  state: 'open' | 'closed';
  priority: 'high' | 'medium' | 'low' | null;
  type: 'bug' | 'feature' | 'documentation' | null;
  createdAt: string;
  closedAt: string | null;
  userEmail: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface IssueStats {
  state: string;
  _count: number;
}

export interface IssueFilters {
  state: string;
  priority: string | null;
  type: string | null;
  search: string;
  page: number;
  limit: number;
  startDate: string | null;
  endDate: string | null;
}

export interface IssueResponse {
  issues: GitHubIssue[];
  total: number;
  page: number;
  totalPages: number;
}
