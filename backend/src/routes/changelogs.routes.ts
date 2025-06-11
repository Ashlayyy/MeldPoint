import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { getAllChangeLogs, getLastVersion } from '../modules/changelogs/controller/changelogs.controller';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

// Routes
router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getAllChangeLogs
);

router.get('/version', getLastVersion);

export default router;
