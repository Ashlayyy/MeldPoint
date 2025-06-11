import jwt from 'jsonwebtoken';
import { UserDevice } from '@prisma/client';
import prisma from '../../../db/prismaClient';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';

interface DeviceRegistrationData {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  currentlyActive: boolean;
}

interface DeviceRegistrationResult {
  device: UserDevice;
  securityToken: string;
  isNewDevice: boolean;
}

export const registerDevice = async (
  userId: string,
  data: DeviceRegistrationData
): Promise<DeviceRegistrationResult> => {
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { deviceId, deviceName, browser, os, currentlyActive } = data;

  // Get previous state if exists
  const previousState = await prisma.userDevice.findFirst({
    where: {
      deviceId,
      userId
    }
  });

  // Update or create device
  const device = await (previousState
    ? prisma.userDevice.update({
        where: { id: previousState.id },
        data: {
          lastActive: new Date(),
          currentlyActive
        }
      })
    : prisma.userDevice.create({
        data: {
          deviceId,
          deviceName,
          browser,
          os,
          lastActive: new Date(),
          currentlyActive,
          userId
        }
      }));

  // Generate security token
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const securityToken = jwt.sign(
    {
      deviceId,
      userId,
      type: 'security'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    device,
    securityToken,
    isNewDevice: !previousState
  };
};

export const getDevices = async (userId: string): Promise<UserDevice[]> => {
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const devices = await prisma.userDevice.findMany({
    where: { userId },
    orderBy: { lastActive: 'desc' }
  });

  return devices;
};

export const updateDeviceStatus = async (userId: string, deviceId: string, isActive: boolean): Promise<UserDevice> => {
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const device = await prisma.userDevice.findFirst({
    where: {
      deviceId,
      userId
    }
  });

  if (!device) {
    throw new BadRequestError('Device not found');
  }

  const updatedDevice = await prisma.userDevice.update({
    where: { id: device.id },
    data: {
      currentlyActive: isActive,
      lastActive: new Date()
    }
  });

  return updatedDevice;
};

export const removeDevice = async (userId: string, deviceId: string): Promise<UserDevice> => {
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const device = await prisma.userDevice.findFirst({
    where: {
      deviceId,
      userId
    }
  });

  if (!device) {
    throw new BadRequestError('Device not found');
  }

  const deletedDevice = await prisma.userDevice.delete({
    where: { id: device.id }
  });

  return deletedDevice;
};
