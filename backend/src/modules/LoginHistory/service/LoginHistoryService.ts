import type { PaginationQuery } from '../validation/schemas';
import type { LoginHistoryWithDevice, PaginatedResponse, DeviceResponse } from '../types';
import {
  findLoginHistoryByUserId,
  countLoginHistoryByUserId,
  findDeviceById,
  findActiveDevicesByUserId,
  findDeviceByUserIdAndDeviceId,
  deleteDeviceById,
  deleteDevicesExcept
} from '../../../db/queries/specialized/loginHistoryQueries';

export async function getUserLoginHistory(
  userId: string,
  { page, limit }: PaginationQuery
): Promise<PaginatedResponse<LoginHistoryWithDevice>> {
  const skip = (page - 1) * limit;

  const [loginHistory, total] = await Promise.all([
    findLoginHistoryByUserId(userId, skip, limit),
    countLoginHistoryByUserId(userId)
  ]);

  const enrichedLoginHistory = await Promise.all(
    loginHistory.map(async (entry) => {
      const currentDevice = await findDeviceById(entry.deviceId);

      return {
        ...entry,
        deviceInfo: {
          deviceId: entry.deviceId,
          browser: entry.browser,
          os: entry.os
        },
        currentDeviceInfo: currentDevice
      };
    })
  );

  return {
    data: enrichedLoginHistory,
    total,
    page,
    limit
  };
}

export async function getUserDevices(userId: string): Promise<DeviceResponse> {
  const devices = await findActiveDevicesByUserId(userId);
  return { data: devices };
}

export async function revokeDevice(userId: string, deviceId: string): Promise<void> {
  const device = await findDeviceByUserIdAndDeviceId(userId, deviceId);

  if (!device) {
    throw new Error('Device not found or not authorized');
  }

  await deleteDeviceById(deviceId);
}

export async function revokeAllDevicesExcept(userId: string, currentDeviceId: string): Promise<void> {
  await deleteDevicesExcept(userId, currentDeviceId);
}
