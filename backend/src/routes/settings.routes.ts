import { PermissionAction, ResourceType } from '@prisma/client';
import { getSettings, updateSettings, resetSettings } from '../modules/Settings/controller/SettingsController';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import { userIdParamSchema, settingsUpdateBodySchema } from '../modules/Settings/validation/schemas';

const router = createSecureRouter();

// Get user settings
router.get(
  '/:userId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: userIdParamSchema }),
  getSettings
);

// Update user settings
router.patch(
  '/:userId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: userIdParamSchema
  }),
  updateSettings
);

// Reset user settings
router.post(
  '/:userId/reset',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: userIdParamSchema }),
  resetSettings
);

export default router;
