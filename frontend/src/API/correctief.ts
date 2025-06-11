/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetCorrectiefById(id: string) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `correctief-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/correctief/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetAllCorrectief() {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/correctief`);
  return { status: response.status, data: response.data.data };
}

export async function CreateCorrectief(data: any) {
  if (!data) throw new Error('Data is required');
  if (data?.Faalkosten < 0) throw new Error('Faalkosten cannot be less than 0');
  if (data?.Faalkosten > 1000000) throw new Error('Faalkosten cannot be more than 1000000');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/correctief`, data);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function UpdateCorrectief(id: string, data: any) {
  if (!id || !data) throw new Error('ID and data are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/correctief/${id}`, data);
  cacheService.remove(`correctief-${id}`);
  return { status: response.status, data: response.data.data };
}
