import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetAllProjectLeiders() {
  const cacheKey = 'projectleiders';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/projectleider`);
  cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 }); // 2 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetProjectLeiderById(id: string) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `projectleider-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/projectleider/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function CreateProjectLeider(data: any) {
  if (!data) throw new Error('Data is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/projectleider`, data);
  cacheService.clear(); // Clear all projectleider caches
  return { status: response.status, data: response.data.data };
}

export async function UpdateProjectLeider(id: string, data: any) {
  if (!id || !data) throw new Error('ID and data are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/projectleider/${id}`, data);
  cacheService.remove(`projectleider-${id}`);
  return { status: response.status, data: response.data.data };
}

export async function DeleteProjectLeider(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/projectleider/${id}`);
  cacheService.remove(`projectleider-${id}`);
  cacheService.clear(); // Clear all since lists will be affected
  return { status: response.status, data: response.data.data };
}
