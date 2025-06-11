import { Permission, PermissionGroup, Role } from '../validation/schemas';
import {
  createPermission,
  createPermissionGroup,
  createRole,
  getAllPermissions,
  getAllPermissionGroups,
  getAllRoles,
  getSinglePermission,
  getSinglePermissionGroup,
  getSingleRole,
  updatePermission,
  updatePermissionGroup,
  updateRole,
  assignPermissionToGroup,
  assignPermissionToRole,
  assignPermissionToUser,
  removePermissionFromGroup,
  removePermissionFromRole,
  removePermissionFromUser,
  deletePermission,
  deletePermissionGroup,
  deleteRole,
  assignRoleToUser,
  assignGroupToUser,
  assignGroupToRole,
  removeRoleFromUser,
  removeGroupFromUser,
  removeGroupFromRole
} from '../../../db/queries';
import logger from '../../../helpers/loggerInstance';

// Permission operations
export const getPermissions = async () => {
  try {
    return await getAllPermissions();
  } catch (error) {
    logger.error(`PermissionsService: Failed to fetch permissions - ${error}`);
    throw error;
  }
};

export const getPermissionById = async (id: string) => {
  try {
    const permission = await getSinglePermission(id);
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  } catch (error) {
    logger.error(`PermissionsService: Failed to fetch permission - ${error}`);
    throw error;
  }
};

export const createNewPermission = async (data: Permission) => {
  try {
    return await createPermission(data);
  } catch (error) {
    logger.error(`PermissionsService: Failed to create permission - ${error}`);
    throw error;
  }
};

export const updatePermissionById = async (id: string, data: Partial<Permission>) => {
  try {
    return await updatePermission(id, data);
  } catch (error) {
    logger.error(`PermissionsService: Failed to update permission - ${error}`);
    throw error;
  }
};

export const deletePermissionById = async (id: string) => {
  try {
    return await deletePermission(id);
  } catch (error) {
    logger.error(`PermissionsService: Failed to delete permission - ${error}`);
    throw error;
  }
};

// Permission Group operations
export const getPermissionGroups = async () => {
  try {
    return await getAllPermissionGroups();
  } catch (error) {
    logger.error(`PermissionsService: Failed to fetch permission groups - ${error}`);
    throw error;
  }
};

export const getPermissionGroupById = async (id: string) => {
  try {
    const group = await getSinglePermissionGroup(id);
    if (!group) {
      throw new Error('Permission group not found');
    }
    return group;
  } catch (error) {
    logger.error(`PermissionsService: Failed to fetch permission group - ${error}`);
    throw error;
  }
};

export const createNewPermissionGroup = async (data: PermissionGroup) => {
  try {
    return await createPermissionGroup(data);
  } catch (error) {
    logger.error(`PermissionsService: Failed to create permission group - ${error}`);
    throw error;
  }
};

export const updatePermissionGroupById = async (id: string, data: Partial<PermissionGroup>) => {
  try {
    return await updatePermissionGroup(id, data);
  } catch (error) {
    logger.error(`PermissionsService: Failed to update permission group - ${error}`);
    throw error;
  }
};

export const deletePermissionGroupById = async (id: string) => {
  try {
    return await deletePermissionGroup(id);
  } catch (error) {
    logger.error(`PermissionsService: Failed to delete permission group - ${error}`);
    throw error;
  }
};

// Role operations
export const getRoles = async () => {
  try {
    return await getAllRoles();
  } catch (error) {
    logger.error(`PermissionsService: Failed to fetch roles - ${error}`);
    throw error;
  }
};

export const getRoleById = async (id: string) => {
  try {
    const role = await getSingleRole(id);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  } catch (error) {
    logger.error(`PermissionsService: Failed to fetch role - ${error}`);
    throw error;
  }
};

export const createNewRole = async (data: Role) => {
  try {
    return await createRole(data);
  } catch (error) {
    logger.error(`PermissionsService: Failed to create role - ${error}`);
    throw error;
  }
};

export const updateRoleById = async (id: string, data: Partial<Role>) => {
  try {
    return await updateRole(id, data);
  } catch (error) {
    logger.error(`PermissionsService: Failed to update role - ${error}`);
    throw error;
  }
};

export const deleteRoleById = async (id: string) => {
  try {
    return await deleteRole(id);
  } catch (error) {
    logger.error(`PermissionsService: Failed to delete role - ${error}`);
    throw error;
  }
};

// Assignment operations
export const assignPermissionToUserById = async (userId: string, permissionId: string) => {
  try {
    return await assignPermissionToUser(userId, permissionId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to assign permission to user - ${error}`);
    throw error;
  }
};

export const assignPermissionToRoleById = async (roleId: string, permissionId: string) => {
  try {
    return await assignPermissionToRole(roleId, permissionId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to assign permission to role - ${error}`);
    throw error;
  }
};

export const assignPermissionToGroupById = async (groupId: string, permissionId: string) => {
  try {
    return await assignPermissionToGroup(groupId, permissionId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to assign permission to group - ${error}`);
    throw error;
  }
};

export const removePermissionFromUserById = async (userId: string, permissionId: string) => {
  try {
    return await removePermissionFromUser(userId, permissionId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to remove permission from user - ${error}`);
    throw error;
  }
};

export const removePermissionFromRoleById = async (roleId: string, permissionId: string) => {
  try {
    return await removePermissionFromRole(roleId, permissionId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to remove permission from role - ${error}`);
    throw error;
  }
};

export const removePermissionFromGroupById = async (groupId: string, permissionId: string) => {
  try {
    return await removePermissionFromGroup(groupId, permissionId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to remove permission from group - ${error}`);
    throw error;
  }
};

export const assignRoleToUserById = async (userId: string, roleId: string) => {
  try {
    return await assignRoleToUser(userId, roleId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to assign role to user - ${error}`);
    throw error;
  }
};

export const assignGroupToUserById = async (userId: string, groupId: string) => {
  try {
    return await assignGroupToUser(userId, groupId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to assign group to user - ${error}`);
    throw error;
  }
};

export const assignGroupToRoleById = async (roleId: string, groupId: string) => {
  try {
    return await assignGroupToRole(roleId, groupId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to assign group to role - ${error}`);
    throw error;
  }
};

export const removeRoleFromUserById = async (userId: string, roleId: string) => {
  try {
    return await removeRoleFromUser(userId, roleId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to remove role from user - ${error}`);
    throw error;
  }
};

export const removeGroupFromUserById = async (userId: string, groupId: string) => {
  try {
    return await removeGroupFromUser(userId, groupId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to remove group from user - ${error}`);
    throw error;
  }
};

export const removeGroupFromRoleById = async (roleId: string, groupId: string) => {
  try {
    return await removeGroupFromRole(roleId, groupId);
  } catch (error) {
    logger.error(`PermissionsService: Failed to remove group from role - ${error}`);
    throw error;
  }
};
