import { Request, Response } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import {
  RegisterDevice,
  GetDevices,
  UpdateDeviceStatus,
  RemoveDevice
} from '../modules/Security/controller/SecurityController';
import {
  deviceRegistrationSchema,
  deviceStatusUpdateSchema,
  deviceRemovalSchema
} from '../modules/Security/validation/schemas';

const router = createSecureRouter();

// Routes
router.get(
  '/devices',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetDevices
);

router.post(
  '/register-device',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ body: deviceRegistrationSchema.shape.body }),
  RegisterDevice
);

router.patch(
  '/devices/:deviceId/status',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: deviceStatusUpdateSchema.shape.params,
    body: deviceStatusUpdateSchema.shape.body
  }),
  UpdateDeviceStatus
);

router.delete(
  '/devices/:deviceId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: deviceRemovalSchema.shape.params }),
  RemoveDevice
);

export default router;
