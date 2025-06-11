import { Request, Response } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import {
  getAllProjectLeiders,
  getSingleProjectLeider,
  createProjectLeider,
  updateProjectLeider,
  deleteProjectLeider
} from '../modules/ProjectLeider/controller/ProjectLeiderController';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

// Routes
router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getAllProjectLeiders
);

router.get(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getSingleProjectLeider
);

router.post(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  createProjectLeider
);

router.patch(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  updateProjectLeider
);

router.delete(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  deleteProjectLeider
);

export default router;
