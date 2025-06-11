/* eslint-disable @typescript-eslint/naming-convention */
import { Request, Response } from 'express';
import { PermissionAction, ResourceType, User as PrismaUser } from '@prisma/client';
import { authenticateMicrosoft, authenticateMicrosoftCallback, isAuthenticated } from '../middleware/auth.middleware';
import {
  GetCurrentUser,
  GetAuthStatus,
  GetAllUsers,
  GetUsersByRole,
  GetUsersByDepartment,
  SearchUsers,
  GetAllUsersForFilter,
  DeleteUser,
  GetActiveUsers,
  Logout
} from '../modules/User/controller/UserController';
import CheckAPIkey from '../middleware/apikey.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import createSecureRouter from '../utils/secureRoute';

// Add Express Request user type declaration
declare global {
  namespace Express {
    interface User extends PrismaUser {}
  }
}

const router = createSecureRouter();

// Public routes
router.get('/auth/microsoft', CheckAPIkey, authenticateMicrosoft);
router.get('/auth/microsoft/callback', authenticateMicrosoftCallback);
router.get('/auth/current', CheckAPIkey, GetCurrentUser);
router.get('/auth/status', CheckAPIkey, GetAuthStatus);

// Logout route
router.post('/logout', CheckAPIkey, Logout);

router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetAllUsers
);

router.get(
  '/role/:role',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetUsersByRole
);

router.get(
  '/department/:department',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  GetUsersByDepartment
);

router.get(
  '/search',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  SearchUsers
);

router.get(
  '/filterUsers',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetAllUsersForFilter
);

router.delete(
  '/:userId',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  DeleteUser
);

router.get(
  '/:id/involved',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetActiveUsers
);

export default router;
