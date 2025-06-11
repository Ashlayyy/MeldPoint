/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetCurrentUser() {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/auth/current`);
  return { status: response.status, data: response.data.data };
}

export async function LoginWithMicrosoft() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/microsoft`;
}

export async function Logout() {
  await axios.post(`${import.meta.env.VITE_API_URL}/user/logout`);
  cacheService.clear();
}

export async function GetAllUsers(params?: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc' }) {
  const cacheKey = `users-${JSON.stringify(params)}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user${queryString}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 }); // 2 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetAllUsersFilters() {
  const cacheKey = `users-filterUsers`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/filterUsers`);
  cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 }); // 2 minutes
  return { status: response.status, data: response.data.data };
}

export async function SearchUsers(params?: {
  query?: string;
  role?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/search${queryString}`);
  return { status: response.status, data: response.data.data };
}

export async function GetUsersByRole(roleId: string, params?: { page?: number; limit?: number }) {
  if (!roleId) throw new Error('Role ID is required');

  const cacheKey = `users-role-${roleId}-${JSON.stringify(params)}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/role/${roleId}${queryString}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetUsersByDepartment(department: string, params?: { page?: number; limit?: number }) {
  if (!department) throw new Error('Department is required');

  const cacheKey = `users-department-${department}-${JSON.stringify(params)}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/department/${department}${queryString}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function DeleteUser(userId: string) {
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/user/${userId}`);
  return { status: response.status, data: response.data.data };
}

export async function UpdateUserDepartment(userId: string, department: string) {
  if (!userId) throw new Error('User ID is required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/department/${userId}/user`, { department });
  cacheService.clear(); // Clear all user caches since department lists may be affected
  return { status: response.status, data: response.data.data };
}
