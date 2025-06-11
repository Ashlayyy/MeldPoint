import axios from '@/utils/axios';
import type { ResponseData } from '@/types/changelog'; // Assuming ResponseData is defined here or adjust import
import { AxiosError } from 'axios';

export const GetChangelogs = async (): Promise<ResponseData> => {
  try {
    const apiUrl = '/changelogs';
    const response = await axios.get<ResponseData>(apiUrl);
    if (response.data && Array.isArray(response.data.changelogs)) {
      return response.data;
    } else {
      throw new Error('API returned data in an unexpected format for /changelogs.');
    }
  } catch (err) {
    console.error('Error fetching changelogs from API:', err);
    if (err instanceof AxiosError) {
      const errorMessage = (err.response?.data as any)?.message || err.message;
      throw new Error(`Failed to fetch changelogs: ${errorMessage} (Status: ${err.response?.status ?? 'N/A'})`);
    }
    throw new Error('An unexpected error occurred while fetching changelogs.');
  }
};

export const GetVersion = async (): Promise<string> => {
  try {
    const apiUrl = '/changelogs/version';
    const response = await axios.get<{ latestVersion: string }>(apiUrl);
    if (response.data && typeof response.data.latestVersion === 'string') {
      return response.data.latestVersion.replace(/^v/, '');
    } else {
      throw new Error('API returned data in an unexpected format for /version. Expected { latestVersion: string }');
    }
  } catch (err) {
    console.error('Error fetching version from API:', err);
    if (err instanceof AxiosError) {
      const errorMessage = (err.response?.data as any)?.message || err.message;
      throw new Error(`Failed to fetch version: ${errorMessage} (Status: ${err.response?.status ?? 'N/A'})`);
    }
    throw new Error('An unexpected error occurred while fetching the version.');
  }
};
