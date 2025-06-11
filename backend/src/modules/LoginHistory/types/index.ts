import { LoginHistory, UserDevice } from '@prisma/client';
import { Device } from '../validation/schemas';

export interface LoginHistoryWithDevice extends Omit<LoginHistory, 'status'> {
  deviceInfo: {
    deviceId: string;
    browser: string | null;
    os: string | null;
  };
  currentDeviceInfo: Device | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DeviceResponse {
  data: UserDevice[];
}

export interface DeviceRevokeResponse {
  status: 'success' | 'error';
  message: string;
}
