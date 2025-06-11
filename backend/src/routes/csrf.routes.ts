import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import getToken from '../modules/CSRF/controller/CSRFController';

const router = createSecureRouter();

router.use(isAuthenticated);

router.get('/token', hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]), getToken);

export default router;
