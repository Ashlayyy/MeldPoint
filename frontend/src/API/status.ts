/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

interface CreateStatusData {
  name: string;
  color: string;
  type: string;
}

interface UpdateStatusData {
  name?: string;
  color?: string;
  type?: string;
}

export async function GetAllStatuses() {
  const cacheKey = 'statuses';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/status`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetStatusById(id: string) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `status-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/status/${id}`);
  cacheService.set(cacheKey, response.data.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function CreateStatus(data: CreateStatusData) {
  if (!data.name) throw new Error('Name is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/status`, data);
  cacheService.clear(); // Clear all status caches on creation
  return { status: response.status, data: response.data.data };
}

export async function UpdateStatus(id: string, data: UpdateStatusData) {
  if (!id) throw new Error('ID is required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/status/${id}`, data);
  cacheService.remove(`status-${id}`); // Clear specific status cache
  cacheService.remove('statuses'); // Clear list cache
  return { status: response.status, data: response.data.data };
}

export async function DeleteStatus(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/status/${id}`);
  return { status: response.status, data: response.data.data };
}
