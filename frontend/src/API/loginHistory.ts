import axios from '@/utils/axios';

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  deviceId: string;
  //deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  status: string;
  createdAt: Date;
  deviceInfo: {
    deviceId: string;
    browser: string;
    os: string;
  };
  currentDeviceInfo: {
    deviceId: string;
    deviceName: string;
    browser: string;
    os: string;
    lastActive: Date;
    currentlyActive: boolean;
  } | null;
}

export interface LoginHistoryResponse {
  data: LoginHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function GetLoginHistory(userId: string, page = 1, limit = 25) {
  if (!userId) throw new Error('User ID is required');

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/login-history/${userId}`, {
    params: { page, limit }
  });
  return { status: response.status, data: response.data.data };
}

export async function GetActiveDevices(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/login-history/${userId}/devices`);
  return { status: response.status, data: response.data.data };
}

export async function RevokeDevice(userId: string, deviceId: string) {
  if (!userId || !deviceId) throw new Error('User ID and Device ID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/login-history/${userId}/devices/${deviceId}`);
  return { status: response.status, data: response.data.data };
}

export async function RevokeAllDevices(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/login-history/${userId}/devices`);
  return { status: response.status, data: response.data.data };
}
