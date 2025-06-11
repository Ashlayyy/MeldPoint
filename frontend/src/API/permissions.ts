/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

interface PaginationParams {
  page?: number;
  limit?: number;
}

export async function GetAllPermissions(params?: PaginationParams) {
  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const cacheKey = `permissions-list${queryString}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/permissions${queryString}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetAllGroups(params?: PaginationParams) {
  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const cacheKey = `groups-list${queryString}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/groups${queryString}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetAllRoles(params?: PaginationParams) {
  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const cacheKey = `roles-list${queryString}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/roles${queryString}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetPermission(id: string) {
  if (!id) throw new Error('ID is required');
  const cacheKey = `permission-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/permission/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetGroup(id: string) {
  if (!id) throw new Error('ID is required');
  const cacheKey = `group-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/group/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetRole(id: string) {
  if (!id) throw new Error('ID is required');
  const cacheKey = `role-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/permissions/role/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function CreatePermission(data: any) {
  if (!data) throw new Error('Data is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/permission`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function CreateGroup(data: any) {
  if (!data) throw new Error('Data is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/group`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function CreateRole(data: any) {
  if (!data) throw new Error('Data is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/role`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function UpdatePermission(id: string, data: any) {
  if (!id || !data) throw new Error('ID and data are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/permissions/permission/${id}`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function UpdateGroup(id: string, data: any) {
  if (!id || !data) throw new Error('ID and data are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/permissions/group/${id}`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function UpdateRole(id: string, data: any) {
  if (!id || !data) throw new Error('ID and data are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/permissions/role/${id}`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function DeletePermission(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/permission/${id}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function DeleteGroup(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/group/${id}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function DeleteRole(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/role/${id}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AssignToUser(userId: string, permissionId: string) {
  if (!userId || !permissionId) throw new Error('User ID and Permission ID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/assign/user/${userId}/permission/${permissionId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AssignToRole(roleId: string, permissionId: string) {
  if (!roleId || !permissionId) throw new Error('Role ID and Permission ID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/assign/role/${roleId}/permission/${permissionId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AssignToGroup(groupId: string, permissionId: string) {
  if (!groupId || !permissionId) throw new Error('Group ID and Permission ID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/assign/group/${groupId}/permission/${permissionId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function RemoveFromUser(userId: string, permissionId: string) {
  if (!userId || !permissionId) throw new Error('User ID and Permission ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/remove/user/${userId}/permission/${permissionId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function RemoveFromRole(roleId: string, permissionId: string) {
  if (!roleId || !permissionId) throw new Error('Role ID and Permission ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/remove/role/${roleId}/permission/${permissionId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function RemoveFromGroup(groupId: string, permissionId: string) {
  if (!groupId || !permissionId) throw new Error('Group ID and Permission ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/remove/group/${groupId}/permission/${permissionId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AssignRoleToUser(userId: string, roleId: string) {
  if (!userId || !roleId) throw new Error('User ID and Role ID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/assign/user/${userId}/role/${roleId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AssignGroupToUser(userId: string, groupId: string) {
  if (!userId || !groupId) throw new Error('User ID and Group ID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/assign/user/${userId}/group/${groupId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AssignGroupToRole(roleId: string, groupId: string) {
  if (!roleId || !groupId) throw new Error('Role ID and Group ID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/permissions/assign/role/${roleId}/group/${groupId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function RemoveRoleFromUser(userId: string, roleId: string) {
  if (!userId || !roleId) throw new Error('User ID and Role ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/remove/user/${userId}/role/${roleId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function RemoveGroupFromUser(userId: string, groupId: string) {
  if (!userId || !groupId) throw new Error('User ID and Group ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/remove/user/${userId}/group/${groupId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function RemoveGroupFromRole(roleId: string, groupId: string) {
  if (!roleId || !groupId) throw new Error('Role ID and Group ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/permissions/remove/role/${roleId}/group/${groupId}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}
