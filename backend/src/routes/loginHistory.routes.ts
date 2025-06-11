import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import {
  GetUserLoginHistory,
  GetUserDevices,
  RevokeDevice,
  RevokeAllDevices
} from '../modules/LoginHistory/controller/LoginHistoryController';
import { UserIdSchema, DeviceIdSchema, PaginationSchema } from '../modules/LoginHistory/validation/schemas';

export const router = createSecureRouter();

// Apply authentication to all routes
router.use(isAuthenticated);

// Apply permission check to all routes
router.use(hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]));

// Get login history for a user with pagination
router.get('/:userId', validateZodRequest({ params: UserIdSchema, query: PaginationSchema }), GetUserLoginHistory);

// Get active devices for a user
router.get('/:userId/devices', validateZodRequest({ params: UserIdSchema }), GetUserDevices);

// Revoke a specific device
router.delete('/:userId/devices/:deviceId', validateZodRequest({ params: DeviceIdSchema }), RevokeDevice);

// Revoke all devices for a user except the current one
router.delete('/:userId/devices', validateZodRequest({ params: UserIdSchema }), RevokeAllDevices);

export default router;
