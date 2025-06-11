/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetAllActiehouders() {
  const cacheKey = 'filterUsers';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/filterUsers`);
  cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 }); // 2 minutes
  return { status: response.status, data: response.data.data };
}
