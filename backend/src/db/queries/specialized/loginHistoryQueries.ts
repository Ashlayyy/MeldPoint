import prisma from '../../prismaClient';

export async function findLoginHistoryByUserId(userId: string, skip: number, take: number) {
  return prisma.loginHistory.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      deviceId: true,
      browser: true,
      os: true,
      ipAddress: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });
}

export async function countLoginHistoryByUserId(userId: string) {
  return prisma.loginHistory.count({
    where: { userId }
  });
}

export async function findDeviceById(deviceId: string) {
  return prisma.userDevice.findFirst({
    where: { deviceId },
    select: {
      deviceId: true,
      deviceName: true,
      browser: true,
      os: true,
      lastActive: true,
      currentlyActive: true
    }
  });
}

export async function findActiveDevicesByUserId(userId: string) {
  return prisma.userDevice.findMany({
    where: {
      userId,
      currentlyActive: true
    },
    select: {
      id: true,
      deviceId: true,
      userId: true,
      deviceName: true,
      browser: true,
      os: true,
      lastActive: true,
      currentlyActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function findDeviceByUserIdAndDeviceId(userId: string, deviceId: string) {
  return prisma.userDevice.findFirst({
    where: {
      userId,
      deviceId
    },
    select: {
      deviceId: true,
      userId: true
    }
  });
}

export async function deleteDeviceById(deviceId: string) {
  return prisma.userDevice.delete({
    where: {
      deviceId
    }
  });
}

export async function deleteDevicesExcept(userId: string, currentDeviceId: string) {
  return prisma.userDevice.deleteMany({
    where: {
      userId,
      deviceId: {
        not: currentDeviceId
      }
    }
  });
}
