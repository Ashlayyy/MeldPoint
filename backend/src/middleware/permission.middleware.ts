/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
/* eslint-disable arrow-body-style */
import { Request, Response, NextFunction } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import { getUserWithPermissions } from '../db/queries/permissions/permissionQueries';
import handleLogging from './handleLogging';
import logger from '../helpers/loggerInstance';

interface PermissionRequirement {
  action: PermissionAction;
  resource: ResourceType;
}

export const hasPermissions = (requirements: PermissionRequirement[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        await handleLogging({
          userId: 'unknown',
          action: 'AUTH_CHECK',
          resourceType: requirements[0].resource,
          success: false,
          metadata: { error: 'No user ID' }
        });
        logger.error(`Permission-Middleware: No user ID`);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await getUserWithPermissions(userId);

      if (!user) {
        await handleLogging({
          userId,
          action: 'AUTH_CHECK',
          resourceType: requirements[0].resource,
          success: false,
          metadata: { error: 'User not found' }
        });
        logger.error(`Permission-Middleware: User not found`);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const effectivePermissions = new Set<string>();

      // Helper function to add permission considering MANAGE as a superset
      const addPermission = (action: string, resource: string) => {
        effectivePermissions.add(`${action}:${resource}`);
        // If the action is MANAGE, add all other actions for the same resource
        if (action === PermissionAction.MANAGE) {
          effectivePermissions.add(`${PermissionAction.CREATE}:${resource}`);
          effectivePermissions.add(`${PermissionAction.READ}:${resource}`);
          effectivePermissions.add(`${PermissionAction.UPDATE}:${resource}`);
          effectivePermissions.add(`${PermissionAction.DELETE}:${resource}`);
        }
      };

      user.userPermissions.forEach((up) => {
        addPermission(up.permission.action, up.permission.resourceType);
      });

      user.userRoles.forEach((ur) => {
        ur.role.rolePermissions.forEach((rp) => {
          addPermission(rp.permission.action, rp.permission.resourceType);
        });

        ur.role.rolePermissionGroups.forEach((rpg) => {
          rpg.group.permissions.forEach((gp) => {
            addPermission(gp.permission.action, gp.permission.resourceType);
          });
        });
      });

      user.userGroups.forEach((ug) => {
        ug.group.permissions.forEach((gp) => {
          addPermission(gp.permission.action, gp.permission.resourceType);
        });
      });

      const hasAllPermissions = requirements.every(({ action, resource }) =>
        effectivePermissions.has(`${action}:${resource}`)
      );

      const adminPermissions = effectivePermissions.has(`${PermissionAction.MANAGE}:${ResourceType.ALL}`);

      if (!hasAllPermissions && !adminPermissions) {
        await handleLogging({
          userId,
          action: 'PERMISSION_CHECK',
          resourceType: requirements[0].resource,
          success: false,
          metadata: {
            required: requirements,
            provided: Array.from(effectivePermissions)
          }
        });
        logger.error(`Permission-Middleware: Insufficient permissions`);
        res.status(403).json({
          message: 'Insufficient permissions',
          required: requirements,
          provided: Array.from(effectivePermissions)
        });
        return;
      }

      next();
    } catch (error) {
      await handleLogging({
        userId: req.user?.id || 'unknown',
        action: 'PERMISSION_CHECK',
        resourceType: requirements[0].resource,
        success: false,
        metadata: { error }
      });
      logger.error(`Permission-Middleware: Permission check error - ${error}`);
      res.status(500).json({ message: 'Internal server error during permission check' });
    }
  };
};
