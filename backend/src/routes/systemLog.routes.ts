import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import CheckAPIkey from '../middleware/apikey.middleware';
import getSystemLogHistory from '../modules/SystemLog/controller/SystemLogController';

const router = createSecureRouter();

router.use(isAuthenticated);

const paramsSchema = {
  params: {
    meldingId: ['optional', 'string'],
    preventiefId: ['optional', 'string'],
    correctiefId: ['optional', 'string']
  }
};

router.get(
  '/melding/:meldingId/:preventiefId/:correctiefId/history',
  //validateRequest(paramsSchema),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  CheckAPIkey,
  getSystemLogHistory
);

export default router;
