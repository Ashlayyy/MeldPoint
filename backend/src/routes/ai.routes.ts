import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import getResponse from '../modules/AI/controller/AIController';
import { messageSchema } from '../modules/AI/validation/schemas';

const router = createSecureRouter();

router.use(isAuthenticated);

router.post(
  '/response',
  validateZodRequest({ body: messageSchema }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getResponse
);

export default router;
