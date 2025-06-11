/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetDashboardStats() {
  const cacheKey = 'dashboard-stats';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/dashboard`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetDepartmentStats() {
  const cacheKey = 'department-stats';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/departments`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetRoleStats() {
  const cacheKey = 'role-stats';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/roles`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetActivityStats(days: number = 30) {
  const cacheKey = `activity-stats-${days}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/activity?days=${days}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetGrowthStats(period: number = 30) {
  const cacheKey = `growth-stats-${period}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/growth?period=${period}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}
