import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import { trackFeature, trackPage } from '../modules/Activity/controller/ActivityController';
import { trackFeatureSchema, trackPageViewSchema } from '../modules/Activity/validation/schemas';

const router = createSecureRouter();

router.use(isAuthenticated);

router.post(
  '/feature',
  validateZodRequest({ body: trackFeatureSchema }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  trackFeature
);

router.post(
  '/pageview',
  validateZodRequest({ body: trackPageViewSchema }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  trackPage
);

export default router;
