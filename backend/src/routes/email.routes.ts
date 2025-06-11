import { PermissionAction, ResourceType } from '@prisma/client';
import {
  SendEmail,
  TrackEmailOpen,
  GetEmailHistory,
  GetEmailTemplate,
  HandleEmailWebhook,
  GetEmailStatus,
  GetAllEmailTracking,
  SendTemplatedEmail,
  GetAvailableTemplates,
  TrackEmailClick,
  TrackOutlookOpen
} from '../modules/Email/controller/EmailController';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateRequest, ValidationRule } from '../middleware/validation.middleware';
import createSecureRouter from '../utils/secureRoute';
import CheckAPIkey from '../middleware/apikey.middleware';

const router = createSecureRouter();

const emailValidationRules: { [key: string]: ValidationRule } = {
  to: ['required', 'string'],
  subject: ['required', 'string'],
  html: ['required', 'string'],
  templateId: ['string'],
  variables: ['object']
};

router.post(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  CheckAPIkey,
  //validateRequest({ body: emailValidationRules }),
  SendEmail
);

// Track email opens
router.get('/track/:trackingId', TrackEmailOpen);

// Get email history
router.get(
  '/history',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetEmailHistory
);

// Get email template
router.get(
  '/template/:templateId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetEmailTemplate
);

// Webhook for email delivery status
router.post('/webhook', HandleEmailWebhook);

// Get email tracking status
router.get(
  '/status/:trackingId',
  isAuthenticated,
  CheckAPIkey,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetEmailStatus
);

// Get all email tracking data
router.get(
  '/tracking/all',
  isAuthenticated,
  CheckAPIkey,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetAllEmailTracking
);

// Send templated email
router.post(
  '/template',
  isAuthenticated,
  CheckAPIkey,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  SendTemplatedEmail
);

// Get available templates
router.get(
  '/templates',
  isAuthenticated,
  CheckAPIkey,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetAvailableTemplates
);

// Track email link clicks
router.get('/track/:trackingId/link', TrackEmailClick);

// Specific Outlook tracking endpoint
router.get('/track/:trackingId/outlook', TrackOutlookOpen);

export default router;
