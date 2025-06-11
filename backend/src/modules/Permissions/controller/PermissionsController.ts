import { Request, Response } from 'express';
import { z } from 'zod';
import { PermissionSchema, PermissionGroupSchema, RoleSchema } from '../validation/schemas';
import * as PermissionsService from '../service/PermissionsService';
import logger from '../../../helpers/loggerInstance';
import { regenerateSession } from '../../../helpers/session';

// Permission Controllers
export const getPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await PermissionsService.getPermissions();
    res.status(200).json({ data: permissions });
  } catch (error) {
    logger.error(`PermissionsController: Failed to fetch permissions - ${error}`);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const getPermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permission = await PermissionsService.getPermissionById(id);
    res.status(200).json({ data: permission });
  } catch (error) {
    if (error instanceof Error && error.message === 'Permission not found') {
      res.status(404).json({ error: 'Permission not found' });
    } else {
      logger.error(`PermissionsController: Failed to fetch permission - ${error}`);
      res.status(500).json({ error: 'Failed to fetch permission' });
    }
  }
};

export const createNewPermission = async (req: Request, res: Response) => {
  try {
    const validatedData = req.body;
    const permission = await PermissionsService.createNewPermission(validatedData);
    res.status(201).json({ data: permission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      logger.error(`PermissionsController: Failed to create permission - ${error}`);
      res.status(500).json({ error: 'Failed to create permission' });
    }
  }
};

export const updateExistingPermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = req.body;
    const permission = await PermissionsService.updatePermissionById(id, validatedData);
    res.status(200).json({ data: permission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      logger.error(`PermissionsController: Failed to update permission - ${error}`);
      res.status(500).json({ error: 'Failed to update permission' });
    }
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await PermissionsService.deletePermissionById(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`PermissionsController: Failed to delete permission - ${error}`);
    res.status(500).json({ error: 'Failed to delete permission' });
  }
};

// Permission Group Controllers
export const getPermissionGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await PermissionsService.getPermissionGroups();
    res.status(200).json({ data: groups });
  } catch (error) {
    logger.error(`PermissionsController: Failed to fetch permission groups - ${error}`);
    res.status(500).json({ error: 'Failed to fetch permission groups' });
  }
};

export const getPermissionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await PermissionsService.getPermissionGroupById(id);
    res.status(200).json({ data: group });
  } catch (error) {
    if (error instanceof Error && error.message === 'Permission group not found') {
      res.status(404).json({ error: 'Permission group not found' });
    } else {
      logger.error(`PermissionsController: Failed to fetch permission group - ${error}`);
      res.status(500).json({ error: 'Failed to fetch permission group' });
    }
  }
};

export const createNewPermissionGroup = async (req: Request, res: Response) => {
  try {
    const validatedData = req.body;
    const group = await PermissionsService.createNewPermissionGroup(validatedData);
    res.status(201).json({ data: group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      logger.error(`PermissionsController: Failed to create permission group - ${error}`);
      res.status(500).json({ error: 'Failed to create permission group' });
    }
  }
};

export const updateExistingPermissionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = req.body;
    const group = await PermissionsService.updatePermissionGroupById(id, validatedData);
    res.status(200).json({ data: group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      logger.error(`PermissionsController: Failed to update permission group - ${error}`);
      res.status(500).json({ error: 'Failed to update permission group' });
    }
  }
};

export const deletePermissionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await PermissionsService.deletePermissionGroupById(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`PermissionsController: Failed to delete permission group - ${error}`);
    res.status(500).json({ error: 'Failed to delete permission group' });
  }
};

// Role Controllers
export const getRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await PermissionsService.getRoles();
    res.status(200).json({ data: roles });
  } catch (error) {
    logger.error(`PermissionsController: Failed to fetch roles - ${error}`);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const getRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await PermissionsService.getRoleById(id);
    res.status(200).json({ data: role });
  } catch (error) {
    if (error instanceof Error && error.message === 'Role not found') {
      res.status(404).json({ error: 'Role not found' });
    } else {
      logger.error(`PermissionsController: Failed to fetch role - ${error}`);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  }
};

export const createNewRole = async (req: Request, res: Response) => {
  try {
    const validatedData = req.body;
    const role = await PermissionsService.createNewRole(validatedData);
    res.status(201).json({ data: role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      logger.error(`PermissionsController: Failed to create role - ${error}`);
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
};

export const updateExistingRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = req.body;
    const role = await PermissionsService.updateRoleById(id, validatedData);
    res.status(200).json({ data: role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      logger.error(`PermissionsController: Failed to update role - ${error}`);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await PermissionsService.deleteRoleById(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`PermissionsController: Failed to delete role - ${error}`);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

// Assignment Controllers
export const assignPermissionToUser = async (req: Request, res: Response) => {
  try {
    const { userId, permissionId } = req.params;
    const result = await PermissionsService.assignPermissionToUserById(userId, permissionId);

    // Regenerate session if the user's own permissions are being modified
    if (req.user?.id === userId) {
      await regenerateSession(req);
    }

    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to assign permission to user - ${error}`);
    res.status(500).json({ error: 'Failed to assign permission to user' });
  }
};

export const assignPermissionToRole = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.params;
    const result = await PermissionsService.assignPermissionToRoleById(roleId, permissionId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to assign permission to role - ${error}`);
    res.status(500).json({ error: 'Failed to assign permission to role' });
  }
};

export const assignPermissionToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, permissionId } = req.params;
    const result = await PermissionsService.assignPermissionToGroupById(groupId, permissionId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to assign permission to group - ${error}`);
    res.status(500).json({ error: 'Failed to assign permission to group' });
  }
};

export const removePermissionFromUser = async (req: Request, res: Response) => {
  try {
    const { userId, permissionId } = req.params;
    const result = await PermissionsService.removePermissionFromUserById(userId, permissionId);

    // Regenerate session if the user's own permissions are being modified
    if (req.user?.id === userId) {
      await regenerateSession(req);
    }

    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to remove permission from user - ${error}`);
    res.status(500).json({ error: 'Failed to remove permission from user' });
  }
};

export const removePermissionFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.params;
    const result = await PermissionsService.removePermissionFromRoleById(roleId, permissionId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to remove permission from role - ${error}`);
    res.status(500).json({ error: 'Failed to remove permission from role' });
  }
};

export const removePermissionFromGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, permissionId } = req.params;
    const result = await PermissionsService.removePermissionFromGroupById(groupId, permissionId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to remove permission from group - ${error}`);
    res.status(500).json({ error: 'Failed to remove permission from group' });
  }
};

export const assignRoleToUser = async (req: Request, res: Response) => {
  try {
    const { userId, roleId } = req.params;
    console.log('assignRoleToUser', userId, roleId);
    const result = await PermissionsService.assignRoleToUserById(userId, roleId);
    console.log('result', result);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to assign role to user - ${error}`);
    res.status(500).json({ error: 'Failed to assign role to user' });
  }
};

export const assignGroupToUser = async (req: Request, res: Response) => {
  try {
    const { userId, groupId } = req.params;
    const result = await PermissionsService.assignGroupToUserById(userId, groupId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to assign group to user - ${error}`);
    res.status(500).json({ error: 'Failed to assign group to user' });
  }
};

export const assignGroupToRole = async (req: Request, res: Response) => {
  try {
    const { roleId, groupId } = req.params;
    const result = await PermissionsService.assignGroupToRoleById(roleId, groupId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to assign group to role - ${error}`);
    res.status(500).json({ error: 'Failed to assign group to role' });
  }
};

export const removeRoleFromUser = async (req: Request, res: Response) => {
  try {
    const { userId, roleId } = req.params;
    const result = await PermissionsService.removeRoleFromUserById(userId, roleId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to remove role from user - ${error}`);
    res.status(500).json({ error: 'Failed to remove role from user' });
  }
};

export const removeGroupFromUser = async (req: Request, res: Response) => {
  try {
    const { userId, groupId } = req.params;
    const result = await PermissionsService.removeGroupFromUserById(userId, groupId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to remove group from user - ${error}`);
    res.status(500).json({ error: 'Failed to remove group from user' });
  }
};

export const removeGroupFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId, groupId } = req.params;
    const result = await PermissionsService.removeGroupFromRoleById(roleId, groupId);
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error(`PermissionsController: Failed to remove group from role - ${error}`);
    res.status(500).json({ error: 'Failed to remove group from role' });
  }
};
