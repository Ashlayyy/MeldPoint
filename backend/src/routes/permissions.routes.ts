/* eslint-disable func-names */
import { Request, Response, NextFunction } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import { getSinglePermission, getSinglePermissionGroup, getSingleRole } from '../db/queries';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import {
  getPermissions,
  getPermission,
  createNewPermission,
  updateExistingPermission,
  deletePermission,
  getPermissionGroups,
  getPermissionGroup,
  createNewPermissionGroup,
  updateExistingPermissionGroup,
  deletePermissionGroup,
  getRoles,
  getRole,
  createNewRole,
  updateExistingRole,
  deleteRole,
  assignPermissionToUser,
  assignPermissionToRole,
  assignPermissionToGroup,
  removePermissionFromUser,
  removePermissionFromRole,
  removePermissionFromGroup,
  assignRoleToUser,
  assignGroupToUser,
  assignGroupToRole,
  removeRoleFromUser,
  removeGroupFromUser,
  removeGroupFromRole
} from '../modules/Permissions/controller/PermissionsController';
import { logSuccess, logError } from '../middleware/handleHistory';
import logger from '../helpers/loggerInstance';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

const getPreviousState = async (req: Request) => {
  const { id } = req.params;
  switch (req.path.split('/')[1]) {
    case 'permission':
      return getSinglePermission(id);
    case 'group':
      return getSinglePermissionGroup(id);
    case 'role':
      return getSingleRole(id);
    default:
      return undefined;
  }
};

// Logging middleware
const logRoute = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime();
    const { id } = req.params;

    try {
      // Create a promise to handle the async response
      const originalSend = res.send;
      let result: any;

      res.send = function (body: any): Response {
        result = body;
        return originalSend.call(this, body);
      };

      // Wait for the route handler to complete
      await new Promise((resolve) => {
        next();
        res.on('finish', resolve);
      });

      const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

      logSuccess(req, {
        action,
        resourceId: id,
        resourceType: ResourceType.ALL,
        metadata: {
          recordCount: Array.isArray(result) ? result.length : undefined,
          previousState: req.method === 'PATCH' || req.method === 'DELETE' ? await getPreviousState(req) : undefined,
          newState: req.method === 'PATCH' ? result : undefined
        }
      });
    } catch (error) {
      logger.error(`Permissions-Routes: Failed to log route - ${error}`);
      logError(req, {
        action,
        resourceId: id,
        resourceType: ResourceType.ALL,
        error: error as Error
      });
      next(error);
    }
  };
};

// Permission Routes
router.get(
  '/permissions',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('GET_ALL_PERMISSIONS'),
  getPermissions
);

router.get(
  '/permission/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('GET_SINGLE_PERMISSION'),
  getPermission
);

router.post(
  '/permission',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('CREATE_PERMISSION'),
  createNewPermission
);

router.patch(
  '/permission/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('UPDATE_PERMISSION'),
  updateExistingPermission
);

router.delete(
  '/permission/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('DELETE_PERMISSION'),
  deletePermission
);

// Permission Group Routes
router.get(
  '/groups',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('GET_ALL_PERMISSION_GROUPS'),
  getPermissionGroups
);

router.get(
  '/group/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('GET_SINGLE_GROUP'),
  getPermissionGroup
);

router.post(
  '/group',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('CREATE_PERMISSION_GROUP'),
  createNewPermissionGroup
);

router.patch(
  '/group/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('UPDATE_PERMISSION_GROUP'),
  updateExistingPermissionGroup
);

router.delete(
  '/group/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('DELETE_PERMISSION_GROUP'),
  deletePermissionGroup
);

// Role Routes
router.get(
  '/roles',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('GET_ALL_ROLES'),
  getRoles
);

router.get(
  '/role/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('GET_SINGLE_ROLE'),
  getRole
);

router.post(
  '/role',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('CREATE_ROLE'),
  createNewRole
);

router.patch(
  '/role/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('UPDATE_ROLE'),
  updateExistingRole
);

router.delete(
  '/role/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('DELETE_ROLE'),
  deleteRole
);

// Assignment Routes
router.post(
  '/assign/user/:userId/permission/:permissionId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('ASSIGN_PERMISSION_TO_USER'),
  assignPermissionToUser
);

router.post(
  '/assign/role/:roleId/permission/:permissionId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('ASSIGN_PERMISSION_TO_ROLE'),
  assignPermissionToRole
);

router.post(
  '/assign/group/:groupId/permission/:permissionId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('ASSIGN_PERMISSION_TO_GROUP'),
  assignPermissionToGroup
);

router.delete(
  '/remove/user/:userId/permission/:permissionId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('REMOVE_PERMISSION_FROM_USER'),
  removePermissionFromUser
);

router.delete(
  '/remove/role/:roleId/permission/:permissionId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('REMOVE_PERMISSION_FROM_ROLE'),
  removePermissionFromRole
);

router.delete(
  '/remove/group/:groupId/permission/:permissionId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('REMOVE_PERMISSION_FROM_GROUP'),
  removePermissionFromGroup
);

router.post(
  '/assign/user/:userId/role/:roleId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('ASSIGN_ROLE_TO_USER'),
  assignRoleToUser
);

router.post(
  '/assign/user/:userId/group/:groupId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('ASSIGN_GROUP_TO_USER'),
  assignGroupToUser
);

router.post(
  '/assign/role/:roleId/group/:groupId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('ASSIGN_GROUP_TO_ROLE'),
  assignGroupToRole
);

router.delete(
  '/remove/user/:userId/role/:roleId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('REMOVE_ROLE_FROM_USER'),
  removeRoleFromUser
);

router.delete(
  '/remove/user/:userId/group/:groupId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('REMOVE_GROUP_FROM_USER'),
  removeGroupFromUser
);

router.delete(
  '/remove/role/:roleId/group/:groupId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  logRoute('REMOVE_GROUP_FROM_ROLE'),
  removeGroupFromRole
);

export default router;
