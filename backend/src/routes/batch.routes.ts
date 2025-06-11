import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import { batchArchive } from '../modules/Batch/controller/BatchController';
import { batchArchiveSchema } from '../modules/Batch/validation/schemas';

const router = createSecureRouter();

router.post(
  '/archive',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ body: batchArchiveSchema }),
  batchArchive
);

export default router;
