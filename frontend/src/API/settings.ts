/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

interface UserSettings {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  language?: string;
  timezone?: string;
}

export async function GetSettings(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const cacheKey = `settings-${userId}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/settings/${userId}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function UpdateSettings(userId: string, settings: UserSettings) {
  if (!userId) throw new Error('User ID is required');
  if (!settings) throw new Error('Settings data is required');

  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/settings/${userId}`, settings);
  cacheService.remove(`settings-${userId}`);
  return { status: response.status, data: response.data.data };
}

export async function ResetSettings(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const response = await axios.post(`${import.meta.env.VITE_API_URL}/settings/${userId}/reset`);
  cacheService.remove(`settings-${userId}`);
  return { status: response.status, data: response.data.data };
}
