import { PermissionAction, ResourceType } from '@prisma/client';
import {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  closeIssue,
  addComment,
  getMyIssues,
  getIssueStats,
  getIssues as getAllIssues,
  updateIssueStatus
} from '../modules/GitHub/controller/GitHubController';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateRequest, ValidationRule } from '../middleware/validation.middleware';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

const githubIssueValidationRules: { [key: string]: ValidationRule } = {
  title: ['required', 'string'],
  body: ['required', 'string'],
  labels: { oneOf: ['bug', 'enhancement', 'documentation', 'help wanted'] }
};

const commentValidationRules: { [key: string]: ValidationRule } = {
  comment: ['required', 'string']
};

const statusValidationRules: { [key: string]: ValidationRule } = {
  status: ['required', 'string', 'oneOf:open,closed'],
  reason: ['optional', 'string'],
  comment: ['optional', 'string']
};

// Create issue
router.post(
  '/issues',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateRequest({ body: githubIssueValidationRules }),
  createIssue
);

// Get all issues
router.get(
  '/issues',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  getIssues
);

// Get my issues
router.get(
  '/issues/me',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getMyIssues
);

// Get issue statistics
router.get(
  '/issues/stats',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  getIssueStats
);

// Get all issues (admin)
router.get(
  '/issues/all',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  getAllIssues
);

// Get single issue
router.get(
  '/issues/:issueNumber',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  getIssue
);

// Update issue
router.patch(
  '/issues/:issueNumber',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  //validateRequest({ body: githubIssueValidationRules }),
  updateIssue
);

// Update issue status (admin)
router.put(
  '/issues/:id/status',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  //validateRequest({ body: statusValidationRules }),
  updateIssueStatus
);

// Close issue
router.post(
  '/issues/:issueNumber/close',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  closeIssue
);

// Add comment
router.post(
  '/issues/:issueNumber/comments',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateRequest({ body: commentValidationRules }),
  addComment
);

export default router;
